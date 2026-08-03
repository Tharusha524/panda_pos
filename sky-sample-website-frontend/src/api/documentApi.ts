import { z } from "zod";
import axios from "axios";
import { StorageFileSchema } from "../utils/StorageFiles.util";

export enum DocumentType {
  CERTIFICATE_AND_AUDIT = "Certificate and Audit",
  GENERAL = "General",
  RISK_ASSESSMENT = "Risk Assessment",
  POLICY_AND_PROCEDURES = "Policy and Procedures",
  LEGAL_AND_STATUTORY = "Legal and Statutory",
}

export const DocumentHistoryItemSchema = z.object({
  documentNumber: z.string(),
  issuedDate: z.date(),
  expiryDate: z.date(),
  notifyDate: z.date(),
});

export type DocumentHistoryItem = z.infer<typeof DocumentHistoryItemSchema>;

export const ActivityStreamSchema = z.object({
  action: z.string(),
  date: z.date(),
  user: z.string(),
});

export const DocumentSchema = z
  .object({
    id: z.string().optional(),
    documentNumber: z.number(),
    versionNumber: z.number(),
    documentType: z.nativeEnum(DocumentType),
    title: z.string(),
    division: z.string(),
    issuingAuthority: z.string(),
    documentOwner: z.string().optional(),
    documentReviewer: z.string(),
    physicalLocation: z.string().optional(),
    remarks: z.string().optional(),
    document: z
      .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
      .optional(),
    issuedDate: z.date(),
    isNoExpiry: z.boolean(),
    expiryDate: z.date().optional(),
    notifyDate: z.date().optional(),
    createdDate: z.date().optional(),
    createdBy: z.string().optional(),
    documentHistory: z.array(DocumentHistoryItemSchema).optional(),
    activityStream: z.array(ActivityStreamSchema).optional(),
    removeDoc: z.array(z.string()).optional(),
  })
  .refine((data) => data.isNoExpiry || (data.expiryDate && data.notifyDate), {
    message: "expiryDate and notifyDate are required when isNoExpiry is false",
    path: ["expiryDate", "notifyDate"], // Set the path of the error
  });

export async function getDocumentList() {
  const res = await axios.get("/api/documents");
  return res.data;
}

export const createDocumentRecord = async (document: Document) => {
  const formData = new FormData();

  Object.keys(document).forEach((key) => {
    const value = document[key as keyof Document];

    if (key === "document" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`document[${index}]`, file as File);
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

  const res = await axios.post("/api/documents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateDocumentRecord = async (documentData: Document) => {
  const formData = new FormData();

  Object.keys(documentData).forEach((key) => {
    const value = documentData[key as keyof Document];

    if (key === "document" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`document[${index}]`, file as File);
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

  const res = await axios.post(
    `/api/documents/${documentData.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  return res.data;
};

export const deleteDocumentRecord = async (id: string) => {
  const res = await axios.delete(`/api/documents/${id}/delete`);
  return res.data;
};

export type Document = z.infer<typeof DocumentSchema>;
