import axios from "axios";

export interface EmployeeSettings {
  id: number;
  allow_employee_auto_number: boolean;
}

export type EmployeeSettingsPayload = Partial<Omit<EmployeeSettings, "id">>;

export async function getEmployeeSettings(): Promise<EmployeeSettings> {
  const res = await axios.get("/api/settings/employee");
  return res.data.data;
}

export async function updateEmployeeSettings(
  payload: EmployeeSettingsPayload
): Promise<EmployeeSettings> {
  const res = await axios.put("/api/settings/employee", payload);
  return res.data.data;
}
