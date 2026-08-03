import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  medicineName: z.string(),
  genaricName: z.string(),
  dossageStrength: z.string(),
  form: z.string(),
  medicineType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchMedicineList() {
  const res = await axios.get("/api/medicine-name");
  return res.data;
}