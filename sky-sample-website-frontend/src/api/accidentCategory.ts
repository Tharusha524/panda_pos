import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  categoryName: z.string(),
  subCategoryName: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchAccidentSubCategory(categoryName) {
  const res = await axios.get(`/api/accident-categories/${categoryName}/subcategories`);
  return res.data;
}

export async function fetchMainAccidentCategory() {
  const res = await axios.get("/api/accident-categories");
  return res.data;
}