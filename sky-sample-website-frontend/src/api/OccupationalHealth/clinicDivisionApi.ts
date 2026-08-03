import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  benefitType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;


export async function fetchAllBenefitList() {
  const res = await axios.get("/api/benefit-types");
  return res.data;
}