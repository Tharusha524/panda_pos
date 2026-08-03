<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\BackupService;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\BinaryFileResponse;

class BackupController extends Controller
{
    public function __construct(private BackupService $backupService)
    {
    }

    public function index(Request $request)
    {
        try {
            return response()->json([
                'success' => true,
                'data' => $this->backupService->listForUser($request->user()),
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function store(Request $request)
    {
        try {
            $backup = $this->backupService->createForUser($request->user());
            $message = 'Backup created successfully.';
            if (($backup['method'] ?? '') === 'php') {
                $message .= ' Used in-app export (mysqldump was skipped or unavailable on this server).';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'data' => $backup,
            ], 201);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function upload(Request $request)
    {
        try {
            $validated = $request->validate([
                'file' => 'required|file|max:204800',
            ]);

            $backup = $this->backupService->uploadForUser(
                $request->user(),
                $validated['file']
            );

            return response()->json([
                'success' => true,
                'message' => 'Backup uploaded successfully.',
                'data' => $backup,
            ], 201);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function download(Request $request, string $filename): BinaryFileResponse|\Illuminate\Http\JsonResponse
    {
        try {
            $path = $this->backupService->resolveDownloadPath($request->user(), $filename);

            return response()->download($path, $filename, [
                'Content-Type' => str_ends_with($filename, '.sqlite')
                    ? 'application/x-sqlite3'
                    : 'application/sql',
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function destroy(Request $request, string $filename)
    {
        try {
            $this->backupService->deleteForUser($request->user(), $filename);

            return response()->json([
                'success' => true,
                'message' => 'Backup deleted.',
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }

    public function restore(Request $request, string $filename)
    {
        try {
            $this->backupService->restoreForUser($request->user(), $filename);

            return response()->json([
                'success' => true,
                'message' => 'Backup restored successfully. Refresh the app to load latest data.',
            ]);
        } catch (\Exception $e) {
            $status = str_contains($e->getMessage(), 'administrators') ? 403 : 400;

            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
            ], $status);
        }
    }
}
