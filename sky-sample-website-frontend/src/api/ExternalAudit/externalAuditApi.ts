import { z } from "zod";
import axios from "axios";
import { userSchema } from "../userApi";
import { StorageFileSchema } from "../../utils/StorageFiles.util";

export enum Announcement {
  ANNOUNCED = "Announced",
  SEMI_ANNOUNCED = "Semi Announced",
  UN_ANNOUNCED = "Un Announced",
}

export enum Status {
  DRAFT = "draft",
  APPROVED = "approved",
  COMPLETE = "complete",
}
export enum ScheduledTaskActionPlanPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export const ScheduledExternalAuditActionPlanSchema = z.object({
  actionPlanId: z.string().optional(),
  externalAuditId: z.number(),
  correctiveOrPreventiveAction: z.string(),
  priority: z.nativeEnum(ScheduledTaskActionPlanPriority).optional(),
  dueDate: z.date(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  targetCompletionDate: z.date(),
  approver: userSchema.optional(),
  approverId: z.string().optional(),
});

export type ScheduledExternalAuditActionPlan = z.infer<
  typeof ScheduledExternalAuditActionPlanSchema
>;

export const ExternalAuditSchema = z.object({
  id: z.number(),
  referenceNumber: z.string(),
  auditType: z.string(),
  auditCategory: z.string(),
  customer: z.string(),
  auditStandard: z.string(),
  auditFirm: z.string(),
  division: z.string(),
  auditDate: z.date(),
  approvalDate: z.date(),
  approver: userSchema,
  approverId: z.number().optional(),
  representor: userSchema.optional(),
  created_At: z.date(),
  createdBy: z.string(),
  status: z.nativeEnum(Status),
  announcement: z.nativeEnum(Announcement),
  remarks: z.string(),
  auditStatus: z.string(),
  auditScore: z.number(),
  numberOfNonCom: z.number(),
  gradePeriod: z.string(),
  auditFee: z.number(),
  auditGrade: z.string(),
  documents: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  responsibleSection: z.string(),
  assigneeLevel: z.string(),
  assessmentDate: z.date(),
  auditExpiryDate: z.date(),
  representorId: z.number(),
  assesmentDate: z.date(),
  createdByUserName: z.string(),
  auditorName: z.string(),
  removeDoc: z.array(z.string()).optional(),
  actionPlan: z.array(ScheduledExternalAuditActionPlanSchema).optional(),
});

export type ExternalAudit = z.infer<typeof ExternalAuditSchema>;

export const updateExternalAudit = async (externalAudit: ExternalAudit) => {
  if (!externalAudit.id) {
    throw new Error("External Audit must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(externalAudit).forEach((key) => {
    const value = externalAudit[key as keyof ExternalAudit];

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
      `/api/external-audit/${externalAudit.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating hazard risk:", error);
    throw error;
  }
};
export async function deleteExternalAudit(id: number) {
  const res = await axios.delete(`/api/external-audit/${id}/delete`);
}
export async function getExternalAuditData() {
  const res = await axios.get("/api/external-audit");
  return res.data;
}
export async function getExternalAssignedAudit() {
  const res = await axios.get("/api/external-audit-assign-task");
  return res.data;
}

export const createExternalAudit = async (externalAudit: ExternalAudit) => {
  const formData = new FormData();

  Object.keys(externalAudit).forEach((key) => {
    const value = externalAudit[key as keyof ExternalAudit];

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

  const res = await axios.post("/api/external-audit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export async function fetchAuditType() {
  const res = await axios.get("/api/external-audit-type");
  return res.data;
}

export async function fetchAuditCategory() {
  const res = await axios.get("/api/external-audit-category");
  return res.data;
}

export async function fetchAuditStandard() {
  const res = await axios.get("/api/external-audit-standard");
  return res.data;
}

export async function fetchAuditFirm() {
  const res = await axios.get("/api/external-audit-firm");
  return res.data;
}

export async function createExternalActionPlan(
  data: Partial<ScheduledExternalAuditActionPlan>
) {
  const res = await axios.post(`/api/external-audit-action-plan`, {
    ...data,
  });
  return res.data;
}

export async function updateExternalActionPlan(
  data: Partial<ScheduledExternalAuditActionPlan>
) {
  const res = await axios.post(
    `/api/external-audit-action-plan/${data.actionPlanId}/update`,
    {
      ...data,
    }
  );
  return res.data;
}

export async function deleteExternalActionPlan({ id }: { id: string }) {
  const res = await axios.delete(
    `/api/external-audit-action-plan/${id}/delete`
  );
  return res.data;
}