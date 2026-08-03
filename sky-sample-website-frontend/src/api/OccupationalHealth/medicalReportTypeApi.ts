import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllMedicalReportType() {
  const res = await axios.get("/api/medical-documents-types");
  return res.data;
}