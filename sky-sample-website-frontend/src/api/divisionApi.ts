import { z } from "zod";
import axios from "axios";

export const divisionSchema = z.object({
  id: z.string(),
  divisionName: z.string(),
});

export type divisionSchema = z.infer<typeof divisionSchema>;

export async function fetchDivision() {
  const res = await axios.get("/api/hr-divisions");
  return res.data;
}