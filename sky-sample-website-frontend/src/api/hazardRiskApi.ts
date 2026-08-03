import { z } from "zod";
import axios from "axios";
import { userSchema } from "./userApi";
import { StorageFileSchema } from "../utils/StorageFiles.util";

export enum CategoryType {
  HEALTH_AND_HSE_MANAGEMENT = "Health and HSE Management",
  CHEMICAL_AND_ENVIRONMENTAL = "Chemical and Environmental",
  MACHINE_SAFETY = "Machine Safety",
  FIRE_AND_EMERGENCY = "Fire and Emergency",
  FACILITY_AND_ELECTRICAL = "Facility and Electrical",
}

export const HazardOrRiskCategories = [
  {
    id: "1",
    name: "Health and HSE Management",
    subCategories: [
      {
        id: "1_1",
        name: "HSE Policy",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "1_2",
        name: "HSE Management System",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "1_3",
        name: "HSE Plan",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
    ],
  },
  {
    id: "2",
    name: "Chemical and Environmental",
    subCategories: [
      {
        id: "2_1",
        name: "Chemical Management",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "2_2",
        name: "Environmental Management",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "2_3",
        name: "Waste Management",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
    ],
  },
  {
    id: "3",
    name: "Machine Safety",
    subCategories: [
      {
        id: "3_1",
        name: "Machine Safety Policy",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "3_2",
        name: "Machine Safety Plan",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "3_3",
        name: "Machine Safety Audit",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
    ],
  },
  {
    id: "4",
    name: "Fire and Emergency",
    observationTypes: ["Observation", "Inspection", "Audit"],
    subCategories: [
      {
        id: "4_1",
        name: "Machine Guarding",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_2",
        name: "Pressure Vessels",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_3",
        name: "Laser Safety",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_4",
        name: "Respiratory Protection",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_5",
        name: "Personal Protective Equipment",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_6",
        name: "Occupational Noise",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_7",
        name: "Occupational Exposure Limits",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_8",
        name: "Radiation",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_9",
        name: "Heat Stress Prevention",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_10",
        name: "Ergonomics",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "4_11",
        name: "Machine Safety",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
    ],
  },
  {
    id: "5",
    name: "Facility and Electrical",
    subCategories: [
      {
        id: "5_1",
        name: "Facility Management",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "5_2",
        name: "Electrical Safety",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
      {
        id: "5_3",
        name: "Facility Safety Audit",
        observationTypes: ["Observation", "Inspection", "Audit"],
      },
    ],
  },
];

export enum RiskLevel {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export enum UnsafeActOrCondition {
  UNSAFE_ACT = "Unsafe Act",
  UNSAFE_CONDITION = "Unsafe Condition",
}
export enum HazardAndRiskStatus {
  OPEN = "Open",
  DRAFT = "Draft",
  PUBLISHED = "Published",
}

export enum HazardDashboardPeriods {
  THIS_WEEK = "This Week",
  LAST_WEEK = "Last Week",
  THIS_MONTH = "This Month",
  LAST_MONTH = "Last Month",
  THIS_YEAR = "This Year",
  LAST_YEAR = "Last Year",
  CUSTOM = "Custom",
}

export const HazardAndRiskSchema = z.object({
  id: z.string().optional(),
  category: z.string(),
  subCategory: z.string(),
  observationType: z.string().optional(),
  division: z.string(),
  locationOrDepartment: z.string(),
  subLocation: z.string().optional(),
  description: z.string().optional(),
  riskLevel: z.nativeEnum(RiskLevel),
  unsafeActOrCondition: z.nativeEnum(UnsafeActOrCondition),
  dueDate: z.date(),
  assignee: userSchema,
  assigneeId: z.number().optional(),
  documents: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
  createdDate: z.date(),
  createdByUser: z.string(),
  status: z.nativeEnum(HazardAndRiskStatus),
  control: z.string().optional(),
  cost: z.string().optional(),
  remarks: z.string().optional(),
  actionTaken: z.string().optional(),
  created_at: z.string(),
  referenceNumber: z.string(),
  createdByUserName: z.string(),
  removeDoc: z.array(z.string()).optional(),
});

export type HazardAndRisk = z.infer<typeof HazardAndRiskSchema>;

export async function getHazardRiskList() {
  const res = await axios.get("/api/hazard-and-risk");
  return res.data;
}

export async function getAssignedHazardRiskList() {
  const res = await axios.get("api/hazard-risks-assign-task");
  return res.data;
}

export const createHazardRisk = async (hazardRisk: HazardAndRisk) => {
  const { getStoredToken } = await import("../utils/authSession");
  const token = `Bearer ${getStoredToken() || ""}`;
  const formData = new FormData();

  formData.append("token", token);

  Object.keys(hazardRisk).forEach((key) => {
    const value = hazardRisk[key as keyof HazardAndRisk];

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

  const res = await axios.post("/api/hazard-and-risk", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateHazardRisk = async (hazardRisk: HazardAndRisk) => {
  if (!hazardRisk.id) {
    throw new Error("HazardAndRisk must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(hazardRisk).forEach((key) => {
    const value = hazardRisk[key as keyof HazardAndRisk];

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

  try {
    const response = await axios.post(
      `/api/hazard-risk/${hazardRisk.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating hazard risk:", error);
    throw error;
  }
};

export const deleteHazardRisk = async (id: string) => {
  const res = await axios.delete(`/api/hazard-risk/${id}/delete`);
  return res.data;
};
