import axios from "axios";

export interface DatabaseBackup {
  filename: string;
  size: number;
  size_label: string;
  created_at: string;
  source: "created" | "uploaded";
  method?: string;
}

export async function listDatabaseBackups(): Promise<DatabaseBackup[]> {
  const res = await axios.get("/api/settings/backups");
  return res.data.data ?? [];
}

export async function createDatabaseBackup(): Promise<DatabaseBackup> {
  const res = await axios.post("/api/settings/backups");
  return res.data.data;
}

export async function uploadDatabaseBackup(file: File): Promise<DatabaseBackup> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await axios.post("/api/settings/backups/upload", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return res.data.data;
}

export async function deleteDatabaseBackup(filename: string): Promise<void> {
  await axios.delete(`/api/settings/backups/${encodeURIComponent(filename)}`);
}

export async function restoreDatabaseBackup(filename: string): Promise<void> {
  await axios.post(`/api/settings/backups/${encodeURIComponent(filename)}/restore`);
}

export async function downloadDatabaseBackup(filename: string): Promise<void> {
  const res = await axios.get(
    `/api/settings/backups/${encodeURIComponent(filename)}/download`,
    { responseType: "blob" }
  );
  const blob = new Blob([res.data], {
    type: filename.endsWith(".sqlite") ? "application/x-sqlite3" : "application/sql",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
