import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  typeConcerns: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchTypeOfConcerns() {
  const res = await axios.get("/api/incident-types-concern");
  return res.data;
}