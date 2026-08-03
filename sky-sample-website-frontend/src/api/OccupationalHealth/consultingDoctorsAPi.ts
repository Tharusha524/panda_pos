import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  doctorName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllDoctors() {
  const res = await axios.get("/api/consulting-doctors");
  return res.data;
}