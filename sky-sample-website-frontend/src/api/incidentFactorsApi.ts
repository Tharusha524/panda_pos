import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  factorName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllFactors() {
  const res = await axios.get("/api/incident-factors");
  return res.data;
}