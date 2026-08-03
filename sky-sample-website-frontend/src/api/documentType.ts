import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  documentType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllDocumentType() {
  const res = await axios.get("/api/documents-types");
  return res.data;
}