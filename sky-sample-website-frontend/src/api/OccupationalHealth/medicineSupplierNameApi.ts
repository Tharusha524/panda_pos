import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  supplierName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllSupplierName() {
  const res = await axios.get("/api/supplier-name");
  return res.data;
}