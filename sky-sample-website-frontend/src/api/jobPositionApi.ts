import { z } from "zod";
import axios from "axios";

export const jobPositionSchema = z.object({
  id: z.string(),
  jobPosition: z.string(),
});

export type jobPositionSchema = z.infer<typeof jobPositionSchema>;

export async function fetchJobPositionData() {
    const res = await axios.get("/api/job-positions");
    return res.data;
}