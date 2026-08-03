<?php

namespace App\Services;

use App\Models\User;
use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\File;
use PDO;
use Symfony\Component\Process\Process;

class BackupService
{
    private const MAX_UPLOAD_BYTES = 209715200; // 200 MB

    private string $backupDir;

    public function __construct(private PermissionService $permissionService)
    {
        $this->backupDir = storage_path('app/backups');
    }

    /**
     * @return list<array{filename: string, size: int, size_label: string, created_at: string, source: string}>
     */
    public function listForUser(User $user): array
    {
        $this->assertCanManageBackups($user);
        $this->ensureBackupDirectory();

        $files = glob($this->backupDir.DIRECTORY_SEPARATOR.'backup_*.{sql,sqlite}', GLOB_BRACE) ?: [];
        usort($files, fn (string $a, string $b) => filemtime($b) <=> filemtime($a));

        return array_values(array_map(function (string $path) {
            $filename = basename($path);
            $size = (int) filesize($path);

            return $this->backupMeta($filename, $size, (int) filemtime($path));
        }, $files));
    }

    /**
     * @return array{filename: string, size: int, size_label: string, created_at: string, source: string, method?: string}
     */
    public function createForUser(User $user): array
    {
        $this->assertCanManageBackups($user);
        $this->ensureBackupDirectory();

        $driver = (string) config('database.default');
        $filename = 'backup_'.now()->format('Y-m-d_His').($driver === 'sqlite' ? '.sqlite' : '.sql');
        $path = $this->backupDir.DIRECTORY_SEPARATOR.$filename;
        $method = 'app';

        if ($driver === 'mysql') {
            $method = $this->createMysqlDump($path);
        } elseif ($driver === 'sqlite') {
            $this->createSqliteCopy($path);
        } else {
            throw new Exception('Database backups are only supported for MySQL and SQLite.');
        }

        if (!is_file($path) || filesize($path) === 0) {
            @unlink($path);
            throw new Exception('Backup file was not created. Check database connection and server permissions.');
        }

        $size = (int) filesize($path);
        $meta = $this->backupMeta($filename, $size, (int) filemtime($path), 'created');
        $meta['method'] = $method;

        return $meta;
    }

    /**
     * @return array{filename: string, size: int, size_label: string, created_at: string, source: string}
     */
    public function uploadForUser(User $user, UploadedFile $file): array
    {
        $this->assertCanManageBackups($user);
        $this->ensureBackupDirectory();

        $ext = strtolower((string) $file->getClientOriginalExtension());
        if (!in_array($ext, ['sql', 'sqlite'], true)) {
            throw new Exception('Only .sql and .sqlite backup files can be uploaded.');
        }

        if ($file->getSize() > self::MAX_UPLOAD_BYTES) {
            throw new Exception('Backup file is too large (maximum 200 MB).');
        }

        $filename = 'backup_upload_'.now()->format('Y-m-d_His').'.'.$ext;
        $path = $this->backupDir.DIRECTORY_SEPARATOR.$filename;

        $file->move($this->backupDir, $filename);

        if (!is_file($path) || filesize($path) === 0) {
            @unlink($path);
            throw new Exception('Uploaded backup could not be saved.');
        }

        if ($ext === 'sql') {
            $raw = (string) file_get_contents($path);
            $normalized = $this->normalizeSqlDumpContent($raw);
            if ($normalized !== $raw) {
                file_put_contents($path, $normalized);
            }
        }

        return $this->backupMeta($filename, (int) filesize($path), (int) filemtime($path), 'uploaded');
    }

    private function sqlLiteral(PDO $pdo, mixed $value): string
    {
        if ($value === null) {
            return 'NULL';
        }
        if (is_bool($value)) {
            return $value ? '1' : '0';
        }
        if (is_int($value) || is_float($value)) {
            return (string) $value;
        }

        return $pdo->quote((string) $value);
    }

    public function resolveDownloadPath(User $user, string $filename): string
    {
        $this->assertCanManageBackups($user);
        $path = $this->resolveSafePath($filename);
        if (!is_file($path)) {
            throw new Exception('Backup file not found.');
        }

        return $path;
    }

    public function deleteForUser(User $user, string $filename): void
    {
        $this->assertCanManageBackups($user);
        $path = $this->resolveSafePath($filename);
        if (!is_file($path)) {
            throw new Exception('Backup file not found.');
        }
        if (!@unlink($path)) {
            throw new Exception('Could not delete backup file.');
        }
    }

    public function restoreForUser(User $user, string $filename): void
    {
        $this->assertCanManageBackups($user);
        $path = $this->resolveSafePath($filename);
        if (!is_file($path)) {
            throw new Exception('Backup file not found.');
        }

        $ext = strtolower((string) pathinfo($path, PATHINFO_EXTENSION));
        if ($ext !== 'sql') {
            throw new Exception('Restore is supported for .sql backups only.');
        }

        $raw = (string) file_get_contents($path);
        if (trim($raw) === '') {
            throw new Exception('Backup file is empty.');
        }
        $sql = $this->normalizeSqlDumpContent($raw);

        DB::beginTransaction();
        try {
            DB::unprepared('SET FOREIGN_KEY_CHECKS=0;');
            DB::unprepared($sql);
            DB::unprepared('SET FOREIGN_KEY_CHECKS=1;');
            DB::commit();
        } catch (\Throwable $e) {
            DB::rollBack();
            throw new Exception('Restore failed: '.$e->getMessage());
        }
    }

    private function assertCanManageBackups(User $user): void
    {
        if (!$this->permissionService->isAdmin($user) && !$this->permissionService->canManageUsers($user)) {
            throw new Exception('Only administrators can manage database backups.');
        }
    }

    private function ensureBackupDirectory(): void
    {
        if (!is_dir($this->backupDir)) {
            File::makeDirectory($this->backupDir, 0755, true);
        }
    }

    private function resolveSafePath(string $filename): string
    {
        $filename = basename($filename);
        if (!preg_match('/^backup_[A-Za-z0-9._-]+\.(sql|sqlite)$/', $filename)) {
            throw new Exception('Invalid backup file name.');
        }

        return $this->backupDir.DIRECTORY_SEPARATOR.$filename;
    }

    /**
     * @return string backup method label
     */
    private function createMysqlDump(string $path): string
    {
        try {
            $this->createMysqlDumpViaMysqldump($path);
            if (is_file($path) && filesize($path) > 0) {
                return 'mysqldump';
            }
        } catch (\Throwable) {
            @unlink($path);
        }

        $this->createMysqlDumpViaPhp($path);

        return 'php';
    }

    private function createMysqlDumpViaMysqldump(string $path): void
    {
        $connection = config('database.connections.mysql');
        $binary = $this->resolveMysqldumpBinary();
        $host = $this->normalizeMysqlHost((string) ($connection['host'] ?? '127.0.0.1'));

        $args = [
            $binary,
            '--protocol=TCP',
            '--host='.$host,
            '--port='.(string) ($connection['port'] ?? '3306'),
            '--user='.(string) ($connection['username'] ?? 'root'),
            '--single-transaction',
            '--routines',
            '--triggers',
            '--column-statistics=0',
            (string) ($connection['database'] ?? ''),
        ];

        $password = (string) ($connection['password'] ?? '');
        if ($password !== '') {
            $args[] = '--password='.$password;
        }

        $process = new Process($args);
        $process->setTimeout(600);
        $process->run();

        if (!$process->isSuccessful()) {
            $detail = trim($process->getErrorOutput() ?: $process->getOutput());
            throw new Exception(
                'mysqldump failed.'
                .($detail !== '' ? ' '.$detail : '')
            );
        }

        $output = $process->getOutput();
        if ($output === '') {
            throw new Exception('mysqldump produced an empty file.');
        }

        $normalized = $this->normalizeSqlDumpContent($output);
        if (file_put_contents($path, $normalized) === false) {
            throw new Exception('Could not write mysqldump output to disk.');
        }
    }

    private function createMysqlDumpViaPhp(string $path): void
    {
        $database = (string) config('database.connections.mysql.database');
        if ($database === '') {
            throw new Exception('MySQL database name is not configured.');
        }

        /** @var PDO $pdo */
        $pdo = DB::connection()->getPdo();
        $tableKey = 'Tables_in_'.$database;
        $tables = DB::select('SHOW TABLES');
        $handle = fopen($path, 'wb');
        if ($handle === false) {
            throw new Exception('Could not create backup file.');
        }

        try {
            fwrite($handle, "-- POS backup (PHP)\n");
            fwrite($handle, '-- Generated: '.now()->toIso8601String()."\n\n");
            fwrite($handle, "SET NAMES utf8mb4;\n");
            fwrite($handle, "SET FOREIGN_KEY_CHECKS=0;\n\n");

            foreach ($tables as $row) {
                $table = (string) ($row->{$tableKey} ?? '');
                if ($table === '') {
                    continue;
                }

                $quotedTable = '`'.str_replace('`', '``', $table).'`';
                $create = DB::selectOne('SHOW CREATE TABLE '.$quotedTable);
                $createSql = (string) ($create->{'Create Table'} ?? '');
                if ($createSql === '') {
                    continue;
                }

                fwrite($handle, "DROP TABLE IF EXISTS {$quotedTable};\n");
                fwrite($handle, $createSql.";\n\n");

                $offset = 0;
                $chunkSize = 250;
                while (true) {
                    $rows = DB::select(
                        'SELECT * FROM '.$quotedTable.' LIMIT '.$chunkSize.' OFFSET '.$offset
                    );
                    if ($rows === []) {
                        break;
                    }

                    foreach ($rows as $record) {
                        $data = (array) $record;
                        $columns = array_keys($data);
                        $columnList = implode(',', array_map(
                            fn (string $col) => '`'.str_replace('`', '``', $col).'`',
                            $columns
                        ));
                        $values = implode(',', array_map(
                            fn ($value) => $this->sqlLiteral($pdo, $value),
                            array_values($data)
                        ));
                        fwrite(
                            $handle,
                            "INSERT INTO {$quotedTable} ({$columnList}) VALUES ({$values});\n"
                        );
                    }

                    $offset += $chunkSize;
                }

                fwrite($handle, "\n");
            }

            fwrite($handle, "SET FOREIGN_KEY_CHECKS=1;\n");
        } finally {
            fclose($handle);
        }
    }

    private function normalizeMysqlHost(string $host): string
    {
        $host = trim($host);
        if ($host === '' || strtolower($host) === 'localhost') {
            return '127.0.0.1';
        }

        return $host;
    }

    private function resolveMysqldumpBinary(): string
    {
        $candidates = ['mysqldump'];
        if (PHP_OS_FAMILY === 'Windows') {
            $candidates[] = 'C:\\xampp\\mysql\\bin\\mysqldump.exe';
            $candidates[] = 'C:\\wamp64\\bin\\mysql\\mysql8.0.31\\bin\\mysqldump.exe';
        }

        foreach ($candidates as $candidate) {
            $process = new Process([$candidate, '--version']);
            $process->run();
            if ($process->isSuccessful()) {
                return $candidate;
            }
        }

        throw new Exception('mysqldump was not found.');
    }

    private function createSqliteCopy(string $path): void
    {
        $database = (string) config('database.connections.sqlite.database');
        if ($database === '' || !is_file($database)) {
            throw new Exception('SQLite database file not found.');
        }
        if (!@copy($database, $path)) {
            throw new Exception('Could not copy SQLite database file.');
        }
    }

    private function normalizeSqlDumpContent(string $content): string
    {
        if ($content === '') {
            return $content;
        }

        // Fix broken headers/comments like:
        // ---- Database: `db`---- ---- Table structure for table `x`--CREATE TABLE ...
        $normalized = preg_replace('/(?<!-)(----\s+)/m', '-- ', $content) ?? $content;
        $normalized = preg_replace('/(--[^\r\n]*)(CREATE TABLE|INSERT INTO|DROP TABLE|ALTER TABLE|LOCK TABLES|UNLOCK TABLES)\b/i', "$1\n$2", $normalized) ?? $normalized;
        $normalized = preg_replace('/(--[^\r\n]*)(--\s*Table structure for table\b)/i', "$1\n$2", $normalized) ?? $normalized;

        return $normalized;
    }

    /**
     * @return array{filename: string, size: int, size_label: string, created_at: string, source: string}
     */
    private function backupMeta(string $filename, int $size, int $mtime, ?string $source = null): array
    {
        return [
            'filename' => $filename,
            'size' => $size,
            'size_label' => $this->formatBytes($size),
            'created_at' => date('c', $mtime),
            'source' => $source ?? (str_starts_with($filename, 'backup_upload_') ? 'uploaded' : 'created'),
        ];
    }

    private function formatBytes(int $bytes): string
    {
        if ($bytes < 1024) {
            return $bytes.' B';
        }
        if ($bytes < 1024 * 1024) {
            return round($bytes / 1024, 1).' KB';
        }

        return round($bytes / (1024 * 1024), 2).' MB';
    }
}
