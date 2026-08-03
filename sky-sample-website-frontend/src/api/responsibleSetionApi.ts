import { z } from "zod";
import axios from "axios";

export const sectionSchema = z.object({
  id: z.string(),
  sectionName: z.string(),
  sectionCode: z.string(),
  responsibleId: z.string()
});

export type Section = z.infer<typeof sectionSchema>;

export async function fetchResponsibleSectionData() {
    const res = await axios.get("/api/responsible-section");
    return res.data;
}