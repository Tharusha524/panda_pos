import { z } from "zod";
import axios from "axios";

export const departmentSchema = z.object({
  id: z.string(),
  department: z.string(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type departmentSchema = z.infer<typeof departmentSchema>;

export async function fetchDepartmentData() {
  const res = await axios.get("/api/departments");
  return res.data;
}
