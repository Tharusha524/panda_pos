import { z } from "zod";
import axios from "axios";

export const categorySchema = z.object({
  id: z.string(),
  categoryName: z.string(),
  subCategory: z.string(),
  observationType: z.string(),
});

export type categorySchema = z.infer<typeof categorySchema>;

export async function fetchSubCategory(categoryName) {
  const res = await axios.get(`/api/categories/${categoryName}/subcategories`);
  return res.data;
}

export async function fetchObservationType(categoryName) {
  const res = await axios.get(`/api/subcategories/${categoryName}/observations`);
  return res.data;
}

export async function fetchMainCategory() {
  const res = await axios.get("/api/categories");
  return res.data;
}

export async function createObservation({
  categoryName,
  subCategory,
  observationType,
}: {
  categoryName: string;
  subCategory: string;
  observationType: string;
}) {
  const res = await axios.post(`/api/store-observation`, {
    categoryName,
    subCategory,
    observationType,
  });

  return res;
}
