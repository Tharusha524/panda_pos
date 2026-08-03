import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllCircumstances() {
  const res = await axios.get("/api/incident-circumstances");
  return res.data;
}