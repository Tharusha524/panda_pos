import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  designationName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchDesignation() {
  const res = await axios.get("/api/designations");
  return res.data;
}
