import axios from "axios";
import { z } from "zod";
import { userSchema } from "../userApi";

export const ConsumptionSchema = z.object({
  consumptionId: z.number(),
  category: z.string(),
  source: z.string(),
  unit: z.string(),
  quantity: z.number(),
  amount: z.number(),
  ghgInTonnes: z.string(),
  methodOfTracking: z.string(),
  usageType: z.string(),
  doYouHaveREC: z.number(),
  scope: z.string(),
  description: z.string(),
});

export enum Status {
  DRAFT = "draft",
  APPROVED = "approved",
}

export type Consumption = z.infer<typeof ConsumptionSchema>;

export const EnvironmentSchema = z.object({
  id: z.string(),
  consumptionId: z.number(),
  referenceNumber: z.string(),
  division: z.string(),
  totalWorkForce: z.number(),
  numberOfDaysWorked: z.number(),
  impactConsumption: z.array(ConsumptionSchema),
  areaInSquareMeter: z.number(),
  reviewerId: z.number(),
  reviewer: userSchema,
  approverId: z.number(),
  approver: userSchema,
  status: z.nativeEnum(Status),
  area: z.number(),
  year: z.string(),
  month: z.string(),
  totalProductProducedPcs: z.number(),
  totalProductProducedKg: z.number(),
  createdBy: z.string(),
  created_at: z.date(),
  createdByUserName: z.string(),
});

export type Environment = z.infer<typeof EnvironmentSchema>;

export async function createConsumption(environment: Environment) {
  const formData = new FormData();

  Object.keys(environment).forEach((key) => {
    const value = environment[key];

    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (
          key === "impactConsumption" &&
          typeof item === "object" &&
          item !== null
        ) {
          Object.keys(item).forEach((nestedKey) => {
            const nestedValue = item[nestedKey];
            if (nestedValue !== null && nestedValue !== undefined) {
              formData.append(
                `${key}[${index}][${nestedKey}]`,
                nestedValue.toString()
              );
            }
          });
        } else {
          // For any other array
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === "object") {
      // Optional: handle nested non-array objects if needed
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post(`/api/environment-record`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
}

export async function getConsumptionList() {
  const res = await axios.get("/api/environment-record");
  return res.data;
}

export async function getConsumptionAssignedList() {
  const res = await axios.get("/api/environment-record-assign-task");
  return res.data;
}

export async function updateConsumption(environment: Environment) {
  const formData = new FormData();

  Object.keys(environment).forEach((key) => {
    const value = environment[key];

    if (value === null || value === undefined) {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (
          key === "impactConsumption" &&
          typeof item === "object" &&
          item !== null
        ) {
          Object.keys(item).forEach((nestedKey) => {
            const nestedValue = item[nestedKey];
            if (nestedValue !== null && nestedValue !== undefined) {
              formData.append(
                `${key}[${index}][${nestedKey}]`,
                nestedValue.toString()
              );
            }
          });
        } else {
          // For any other array
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === "object") {
      // Optional: handle nested non-array objects if needed
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post(
    `/api/environment-record/${environment.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
}

export async function deleteConsumption(id: string) {
  const res = await axios.delete(`/api/environment-record/${id}/delete`);
  return res.data;
}

export async function fetchConsumptionCategories() {
  const res = await axios.get(`/api/consumption-get-categories`);
  return res.data;
}

export async function fetchConsumptionUnit(category: string) {
  const res = await axios.get(`/api/consumption-get/${category}/units`);
  return res.data;
}

export async function fetchConsumptionSource(category: string) {
  const res = await axios.get(`/api/consumption-get/${category}/sources`);
  return res.data;
}

export async function fetchConsumptionAssignee() {
  const res = await axios.get(`/api/environment-record-assignee`);
  return res.data;
}
