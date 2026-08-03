import React, { useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import BackupIcon from "@mui/icons-material/Backup";
import CloudDownloadIcon from "@mui/icons-material/CloudDownload";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import RefreshIcon from "@mui/icons-material/Refresh";
import RestoreIcon from "@mui/icons-material/Restore";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import SettingsPageShell from "../components/SettingsPageShell";
import EmployeeAccessGuard from "../components/EmployeeAccessGuard";
import {
  createDatabaseBackup,
  deleteDatabaseBackup,
  downloadDatabaseBackup,
  listDatabaseBackups,
  restoreDatabaseBackup,
  uploadDatabaseBackup,
  type DatabaseBackup,
} from "../../../../api/Settings/backupSettingsApi";
import { getFriendlyErrorMessage } from "../../../../utils/getFriendlyErrorMessage";

function formatBackupDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
}

const BackupSettings: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [downloadingFile, setDownloadingFile] = useState<string | null>(null);
  const [restoringFile, setRestoringFile] = useState<string | null>(null);

  const { data: backups = [], isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["database-backups"],
    queryFn: listDatabaseBackups,
  });

  const prependBackup = (created: DatabaseBackup) => {
    queryClient.setQueryData<DatabaseBackup[]>(["database-backups"], (prev = []) => [
      created,
      ...prev.filter((row) => row.filename !== created.filename),
    ]);
  };

  const createMutation = useMutation({
    mutationFn: createDatabaseBackup,
    onSuccess: (created) => {
      prependBackup(created);
      setActionError(null);
      const methodNote =
        created.method === "php"
          ? " (exported via app — no mysqldump needed)"
          : created.method === "mysqldump"
            ? " (mysqldump)"
            : "";
      setActionMessage(`Backup created: ${created.filename} (${created.size_label})${methodNote}`);
    },
    onError: (err: unknown) => {
      setActionMessage(null);
      setActionError(getFriendlyErrorMessage(err, "Could not create backup"));
    },
  });

  const uploadMutation = useMutation({
    mutationFn: uploadDatabaseBackup,
    onSuccess: (uploaded) => {
      prependBackup(uploaded);
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setActionError(null);
      setActionMessage(`Uploaded ${uploaded.filename} (${uploaded.size_label})`);
    },
    onError: (err: unknown) => {
      setActionMessage(null);
      setActionError(getFriendlyErrorMessage(err, "Could not upload backup"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteDatabaseBackup,
    onSuccess: (_, filename) => {
      queryClient.setQueryData<DatabaseBackup[]>(["database-backups"], (prev = []) =>
        prev.filter((row) => row.filename !== filename)
      );
      setActionError(null);
      setActionMessage(`Deleted ${filename}`);
    },
    onError: (err: unknown) => {
      setActionMessage(null);
      setActionError(getFriendlyErrorMessage(err, "Could not delete backup"));
    },
  });

  const handleDownload = async (filename: string) => {
    setDownloadingFile(filename);
    setActionMessage(null);
    setActionError(null);
    try {
      await downloadDatabaseBackup(filename);
      setActionMessage(`Downloaded ${filename}`);
    } catch (err: unknown) {
      setActionError(getFriendlyErrorMessage(err, "Could not download backup"));
    } finally {
      setDownloadingFile(null);
    }
  };

  const handleDelete = (filename: string) => {
    if (!window.confirm(`Delete backup ${filename}?`)) return;
    deleteMutation.mutate(filename);
  };

  const handleRestore = async (filename: string) => {
    const confirmed = window.confirm(
      `Restore database from ${filename}? This will overwrite current database data.`
    );
    if (!confirmed) return;
    setRestoringFile(filename);
    setActionMessage(null);
    setActionError(null);
    try {
      await restoreDatabaseBackup(filename);
      setActionMessage(`Restored database from ${filename}. Please refresh the app.`);
    } catch (err: unknown) {
      setActionError(getFriendlyErrorMessage(err, "Could not restore backup"));
    } finally {
      setRestoringFile(null);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0] ?? null;
    setSelectedFile(file);
    setActionMessage(null);
    setActionError(null);
  };

  const handleUpload = () => {
    if (!selectedFile) return;
    const ext = selectedFile.name.split(".").pop()?.toLowerCase();
    if (ext !== "sql" && ext !== "sqlite") {
      setActionError("Only .sql or .sqlite backup files can be uploaded.");
      return;
    }
    uploadMutation.mutate(selectedFile);
  };

  return (
    <EmployeeAccessGuard>
      <SettingsPageShell
        title="Backup"
        subtitle="Create, upload, and download database backups"
        wide
        hideSave
      >
        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center", mb: 2 }}>
          <Button
            variant="contained"
            startIcon={
              createMutation.isPending ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <BackupIcon />
              )
            }
            onClick={() => createMutation.mutate()}
            disabled={createMutation.isPending || uploadMutation.isPending}
            sx={{ bgcolor: "var(--pallet-blue)", "&:hover": { bgcolor: "var(--pallet-main-blue)" } }}
          >
            {createMutation.isPending ? "Creating…" : "Create backup"}
          </Button>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void refetch()}
            disabled={isFetching}
          >
            Refresh
          </Button>
        </Box>

        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            borderStyle: "dashed",
            borderColor: "#90caf9",
            bgcolor: "var(--surface-bg-alt)",
          }}
        >
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
            Upload backup
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Upload a .sql or .sqlite file from your computer (max 200 MB). Files are stored on the
            server so you can download or keep them for restore.
          </Typography>
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5, alignItems: "center" }}>
            <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>
              Choose file
              <input
                ref={fileInputRef}
                type="file"
                hidden
                accept=".sql,.sqlite,application/sql,text/plain"
                onChange={handleFileChange}
              />
            </Button>
            {selectedFile ? (
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
              </Typography>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No file selected
              </Typography>
            )}
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploadMutation.isPending || createMutation.isPending}
              startIcon={
                uploadMutation.isPending ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <CloudUploadIcon />
                )
              }
            >
              {uploadMutation.isPending ? "Uploading…" : "Upload backup"}
            </Button>
          </Box>
        </Paper>

        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Create backup</strong> uses the same database connection as the app. If mysqldump
          fails on Windows, the app export runs automatically. Restore by importing the .sql file in
          phpMyAdmin or MySQL Workbench.
        </Alert>

        {actionMessage ? (
          <Alert severity="success" sx={{ mb: 2 }} onClose={() => setActionMessage(null)}>
            {actionMessage}
          </Alert>
        ) : null}
        {actionError ? (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
            {actionError}
          </Alert>
        ) : null}

        {isLoading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : isError ? (
          <Alert severity="error">{getFriendlyErrorMessage(error, "Could not load backups")}</Alert>
        ) : (
          <TableContainer component={Paper} variant="outlined">
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>File</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Source</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Created</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>
                    Size
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, width: 170 }}>
                    Actions
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {backups.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 4, color: "text.secondary" }}>
                      No backups yet. Create a backup or upload a .sql file.
                    </TableCell>
                  </TableRow>
                ) : (
                  backups.map((backup) => (
                    <TableRow key={backup.filename} hover>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {backup.filename}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={backup.source === "uploaded" ? "Uploaded" : "Created"}
                          color={backup.source === "uploaded" ? "info" : "success"}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>{formatBackupDate(backup.created_at)}</TableCell>
                      <TableCell align="right">{backup.size_label}</TableCell>
                      <TableCell align="right">
                        <Tooltip title="Download">
                          <span>
                            <IconButton
                              size="small"
                              color="primary"
                              onClick={() => void handleDownload(backup.filename)}
                              disabled={downloadingFile === backup.filename}
                            >
                              {downloadingFile === backup.filename ? (
                                <CircularProgress size={18} />
                              ) : (
                                <CloudDownloadIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <span>
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => handleDelete(backup.filename)}
                              disabled={deleteMutation.isPending}
                            >
                              <DeleteOutlineIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Restore to database">
                          <span>
                            <IconButton
                              size="small"
                              color="warning"
                              onClick={() => void handleRestore(backup.filename)}
                              disabled={Boolean(restoringFile) || deleteMutation.isPending}
                            >
                              {restoringFile === backup.filename ? (
                                <CircularProgress size={18} />
                              ) : (
                                <RestoreIcon fontSize="small" />
                              )}
                            </IconButton>
                          </span>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </SettingsPageShell>
    </EmployeeAccessGuard>
  );
};

export default BackupSettings;
