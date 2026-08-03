import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  type: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllSupplierTypes() {
  const res = await axios.get("/api/supplier-type");
  return res.data;
}