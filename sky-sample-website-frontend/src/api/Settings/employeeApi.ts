import axios from "axios";

export interface Employee {
  id: number;
  company_id: number;
  employee_code: string | null;
  display_id: string;
  name: string;
  phone: string;
  address: string;
  monthly_salary: number;
  is_active: boolean;
}

export type EmployeePayload = {
  name: string;
  phone?: string;
  address?: string;
  monthly_salary?: number;
  employee_code?: string;
  is_active?: boolean;
};

export async function fetchEmployees(): Promise<Employee[]> {
  const res = await axios.get("/api/employees");
  return res.data.data;
}

export async function createEmployee(payload: EmployeePayload): Promise<Employee> {
  const res = await axios.post("/api/employees", payload);
  return res.data.data;
}

export async function updateEmployee(
  id: number,
  payload: Partial<EmployeePayload>
): Promise<Employee> {
  const res = await axios.put(`/api/employees/${id}`, payload);
  return res.data.data;
}

export async function deleteEmployee(id: number): Promise<void> {
  await axios.delete(`/api/employees/${id}`);
}
