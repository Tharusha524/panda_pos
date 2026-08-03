import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  type: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchNearMiss() {
  const res = await axios.get("/api/incident-types-nearMiss");
  return res.data;
}