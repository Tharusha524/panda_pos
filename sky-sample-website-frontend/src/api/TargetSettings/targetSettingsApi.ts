import { z } from "zod";
import axios from "axios";
import { StorageFileSchema } from "../../utils/StorageFiles.util";
import { userSchema } from "../userApi";

export enum Status {
  DRAFT = "draft",
  APPROVED = "approved",
}

export const targetSettingsSchema = z.object({
  id: z.string(),
  division: z.string(),
  category: z.string(),
  department: z.string(),
  source: z.string(),
  referenceNumber: z.string(),
  baselineConsumption: z.number(),
  ghgEmission: z.number(),
  problem: z.string(),
  documents: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
  action: z.string(),
  possibilityCategory: z.string(),
  opportunity: z.string(),
  implementationCost: z.string(),
  expectedSavings: z.string(),
  targetGHGReduction: z.string(),
  costSavings: z.string(),
  implementationTime: z.date(),
  paybackPeriod: z.string(),
  projectLifespan: z.string(),
  responsible: userSchema.optional(),
  approver: userSchema.optional(),
  responsibleId: z.number(),
  approverId: z.number(),
  status: z.nativeEnum(Status),
  created_at: z.date(),
  removeDoc: z.array(z.string()).optional(),
});

export type TargetSettings = z.infer<typeof targetSettingsSchema>;

export const createTargetSettings = async (targetSettings: TargetSettings) => {
  const formData = new FormData();

  Object.keys(targetSettings).forEach((key) => {
    const value = targetSettings[key as keyof TargetSettings];

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`documents[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, JSON.stringify(item));
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/target-setting", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateTargetSettings = async (targetSettings: TargetSettings) => {
  if (!targetSettings.id) {
    throw new Error("Target Settings must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(targetSettings).forEach((key) => {
    const value = targetSettings[key as keyof TargetSettings];

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`documents[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, JSON.stringify(item));
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  console.log(targetSettings);

  try {
    const response = await axios.post(
      `/api/target-setting/${targetSettings.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating Target Settings:", error);
    throw error;
  }
};

export const deleteTargetSettings = async (id: string) => {
  const res = await axios.delete(`/api/target-setting/${id}/delete`);
  return res.data;
};

export async function getTargetSettings() {
  const res = await axios.get("api/target-setting");
  return res.data;
}

export async function getAssignedTargetSettings() {
  const res = await axios.get("api/target-setting-assign-task");
  return res.data;
}

export async function getApproverAndAssignee() {
  const res = await axios.get("api/target-setting-assignee");
  return res.data;
}

export async function getSource() {
  const res = await axios.get("api/ts-sources");
  return res.data;
}

export async function fetchMainTsCategory() {
  const res = await axios.get("api/ts-categories");
  return res.data;
}

export async function fetchPossibilityCategory(categoryName: string) {
  const res = await axios.get(
    `/api/categories/${categoryName}/possibilityCategory`
  );
  return res.data;
}

export async function fetchOpportunity(subCategoryName: string) {
  const res = await axios.get(
    `/api/subcategories/${subCategoryName}/opportunities`
  );
  return res.data;
}
