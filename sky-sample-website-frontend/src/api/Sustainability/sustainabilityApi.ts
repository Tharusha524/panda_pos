import axios from "axios";
import { z } from "zod";
import { StorageFileSchema } from "../../utils/StorageFiles.util";

export const ImpactSchema = z.object({
  id: z.string(),
  impactType: z.string(),
  unit: z.string(),
  value: z.string(),
});

export type ImpactSchema = z.infer<typeof ImpactSchema>;

export const SustainabilitySchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  title: z.string(),
  materialityType: z.array(z.string()),
  materialityIssue: z.array(z.string()),
  pillars: z.array(z.string()),
  sdg: z.string(),
  additionalSdg: z.array(z.string()),
  alignmentSdg: z.string(),
  griStandards: z.string(),
  organizer: z.string(),
  volunteer: z.string(),
  priority: z.string(),
  contributing: z.string(),
  impactDetails: z.array(ImpactSchema),
  documents: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  timeLines: z.date(),
  dateOfJoin: z.date(),
  location: z.string(),
  division: z.string(),
  status: z.string(),
});
export type Sustainability = z.infer<typeof SustainabilitySchema>;

export const createSustainabilityReport = async (
  sustainability: Sustainability
) => {
  // Clone and preprocess input
  const processed = { ...sustainability };

  ["pillars", "materialityType", "materialityIssue", "additionalSdg"].forEach(
    (key) => {
      if (processed[key]) {
        try {
          let value = processed[key];
          value = typeof value === "string" ? JSON.parse(value) : value;
          processed[key] = Array.isArray(value)
            ? value.map((item: string) => item.replace(/^"|"$/g, ""))
            : [];
        } catch (error) {
          console.warn(`Failed to parse ${key}:`, processed[key]);
          processed[key] = [];
        }
      }
    }
  );

  const formData = new FormData();

  Object.keys(processed).forEach((key) => {
    const value = processed[key];

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file: File, index: number) => {
        formData.append(`documents[${index}]`, file);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "impactDetails" && typeof item === "object") {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey]?.toString()
            );
          });
        } else {
          formData.append(`${key}[${index}]`, item.toString());
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  try {
    const res = await axios.post("/api/sdg-report", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return res.data;
  } catch (error) {
    console.error("Error creating sustainability report:", error);
    throw error;
  }
};

export const updateSustainabilityReport = async (
  sustainability: Sustainability
) => {
  const formData = new FormData();

  Object.keys(sustainability).forEach((key) => {
    let value = sustainability[key];

    if (
      [
        "pillars",
        "materialityType",
        "materialityIssue",
        "additionalSdg",
      ].includes(key)
    ) {
      try {
        value = typeof value === "string" ? JSON.parse(value) : value;
      } catch (error) {
        console.warn(`Failed to parse ${key}:`, value);
        value = [];
      }
      value = Array.isArray(value)
        ? value.map((item) => item.replace(/^"|"$/g, ""))
        : [];
    }

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (typeof item === "object" && item !== null) {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey]?.toString()
            );
          });
        } else {
          formData.append(`${key}[]`, item);
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  try {
    const res = await axios.post(
      `/api/sdg-report/${sustainability.id}/update`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );
    return res.data;
  } catch (error) {
    console.error("Error updating sustainability report:", error);
    throw error;
  }
};

export const deleteSustainabilityRecord = async (id: string) => {
  const res = await axios.delete(`/api/sdg-report/${id}/delete`);
  return res.data;
};

export async function getSustainabilityList() {
  const res = await axios.get("/api/sdg-report");
  return res.data;
}

export async function getAdditionalSDGList() {
  const res = await axios.get("/api/additional-SDG");
  return res.data;
}

export async function getAlignmentSDGList() {
  const res = await axios.get("/api/alignment-SDG");
  return res.data;
}

export async function getMaterialityissuesList() {
  const res = await axios.get("/api/materiality-issues");
  return res.data;
}

export async function getMaterialitytypeList() {
  const res = await axios.get("/api/materiality-type");
  return res.data;
}

export async function getPillarList() {
  const res = await axios.get("/api/pillars");
  return res.data;
}

export async function getSdgValueList() {
  const res = await axios.get("/api/sdg-value");
  return res.data;
}

export async function getImpactList() {
  const res = await axios.get("/api/impact-type");
  return res.data;
}

export async function fetchImpactUnit(impactType: string) {
  const res = await axios.get(`/api/impact-types/${impactType}/impactUnit`);
  return res.data;
}
