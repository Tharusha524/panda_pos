import { z } from "zod";
import { userSchema } from "../userApi";
import axios from "axios";

export enum InternalAuditType {
  SUPPLY_CHAIN = "Supply Chain",
  COMPANY = "Company",
}

export enum SupplierType {
  TIER_1 = "Tier-1",
  TIER_2 = "Tier-2",
  TIER_3 = "Tier-3",
}

export enum ScheduledInternalAuditStatus {
  DRAFT = "draft",
  SCHEDULED = "scheduled",
  ONGOING = "ongoing",
  COMPLETED = "completed",
}

export enum QuestionColorCodes {
  GREEN = "green",
  YELLOW = "yellow",
  RED = "red",
  BLUE = "blue",
  ORANGE = "orange",
  PURPLE = "purple",
  BLACK = "black",
}

export enum InternalAuditRating {
  EXCELLENT = "Excellent",
  GOOD = "Good",
  SATISFACTORY = "Satisfactory",
  UNSATISFACTORY = "Unsatisfactory",
}

export enum InternalAuditQuestionAnswersStatus {
  YES = "Yes",
  PARTIAL_YES = "Partial Yes",
  PARTIAL_NO = "Partial No",
  NO = "No",
  NA = "N/A",
}

export enum InternalAuditQuestionAnswerRating {
  COMPILED = "Compiled",
  MODERATE = "Moderate",
  HIGH = "High",
  CRITICAL = "Critical",
}

export enum ScheduledTaskActionPlanPriority {
  HIGH = "High",
  MEDIUM = "Medium",
  LOW = "Low",
}

export const InternalAuditQuestionSchema = z.object({
  queId: z.number().optional(),
  question: z.string(),
  colorCode: z.string(),
  allocatedScore: z.number(),
  queGroupId: z.number().optional(),
  questionRecoId: z.number().optional(),
});

export type InternalAuditQuestion = z.infer<typeof InternalAuditQuestionSchema>;

export const InternalAuditQuestionGroupSchema = z.object({
  queGroupId: z.number().optional(),
  quectionRecoId: z.number().optional(),
  groupName: z.string(),
  questions: z.array(InternalAuditQuestionSchema),
});

export type InternalAuditQuestionGroup = z.infer<
  typeof InternalAuditQuestionGroupSchema
>;

export const InternalAuditSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  description: z.string(),
  questionGroups: z.array(InternalAuditQuestionGroupSchema),
  totalNumberOfQuestions: z.number(),
  achievableScore: z.number(),
  created_at: z.date(),
  updated_at: z.date(),
  createdBy: userSchema,
});

export type InternalAudit = z.infer<typeof InternalAuditSchema>;

export const ContactPersonSchema = z.object({
  id: z.string().optional(),
  name: z.string(),
  updatedAt: z.date(),
  createdAt: z.date(),
});

export type ContactPerson = z.infer<typeof ContactPersonSchema>;

export const FactorySchema = z.object({
  id: z.string().optional(),
  factoryName: z.string(),
  factoryEmail: z.string(),
  factoryAddress: z.string(),
  factoryContactNumber: z.string(),
  designation: z.string(),
  factoryContactPerson: ContactPersonSchema,
  factoryContactPersonName: z.string(),
  factoryContactPersonId: z.string(),
});

export type Factory = z.infer<typeof FactorySchema>;

export const ProcessTypeSchema = z.object({
  id: z.string().optional(),
  processType: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type ProcessType = z.infer<typeof ProcessTypeSchema>;

export const auditeeSchema = z.object({
  id: z.number().optional(),
  name: z.string(),
  email: z.string(),
});

export type Auditee = z.infer<typeof auditeeSchema>;

export const InternalAuditAnswerToQuestionsSchema = z.object({
  answerId: z.number().optional(),
  internalAuditId: z.number().optional(),
  questionRecoId: z.number().optional(),
  queGroupId: z.number().optional(),
  questionId: z.number().optional(),
  score: z.number(),
  status: z.nativeEnum(InternalAuditQuestionAnswersStatus).optional(),
  rating: z.nativeEnum(InternalAuditQuestionAnswerRating).optional(),
});

export type InternalAuditAnswerToQuestions = z.infer<
  typeof InternalAuditAnswerToQuestionsSchema
>;

export const ScheduledInternalAuditActionPlanSchema = z.object({
  actionPlanId: z.string().optional(),
  internalAuditId: z.number(),
  correctiveOrPreventiveAction: z.string(),
  priority: z.nativeEnum(ScheduledTaskActionPlanPriority).optional(),
  dueDate: z.date(),
  created_at: z.date(),
  updated_at: z.date().optional(),
  targetCompletionDate: z.date(),
  approver: userSchema.optional(),
  approverId: z.string().optional(),
});

export type ScheduledInternalAuditActionPlan = z.infer<
  typeof ScheduledInternalAuditActionPlanSchema
>;

export const InternalAuditDepartmentSchema = z.object({
  id: z.string().optional(),
  department: z.string(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type InternalAuditDepartment = z.infer<
  typeof InternalAuditDepartmentSchema
>;

export const ScheduledInternalAuditSchema = z.object({
  id: z.number().optional(),
  referenceNumber: z.string(),
  auditDate: z.date(),
  division: z.string(),
  department: z.array(InternalAuditDepartmentSchema),
  audit: InternalAuditSchema,
  auditId: z.string(),
  auditType: z.nativeEnum(InternalAuditType),
  answeredQuestionCount: z.number().optional(),
  earnedScore: z.number().optional(),
  earnedScorePercentage: z.number().optional(),
  answers: z.array(InternalAuditAnswerToQuestionsSchema).optional(),
  rating: z.nativeEnum(InternalAuditRating).optional(),
  isAuditScheduledForSupplier: z.boolean(),
  factoryName: z.string(),
  factory: FactorySchema,
  factoryId: z.string(),
  factoryAddress: z.string(),
  factoryEmail: z.string(),
  factoryContactPerson: ContactPersonSchema,
  factoryContactPersonName: z.string(),
  factoryContactPersonId: z.string(),
  factoryContactNumber: z.string(),
  supplierType: z.nativeEnum(SupplierType).optional(),
  factoryLicenseNo: z.string().optional(),
  higgId: z.string().optional(),
  zdhcId: z.string().optional(),
  processType: z.string().optional(),
  processTypeId: z.string().optional(),
  description: z.string().optional(),
  designation: z.string().optional(),
  auditee: auditeeSchema.optional(),
  auditeeId: z.number().optional(),
  approver: userSchema,
  approverId: z.number(),
  dateForApproval: z.date(),
  status: z.nativeEnum(ScheduledInternalAuditStatus).optional(),
  created_at: z.date(),
  updated_at: z.date(),
  createdBy: userSchema,
  auditStatus: z.string().optional(),
  actionPlan: z.array(ScheduledInternalAuditActionPlanSchema).optional(),
});

export type ScheduledInternalAudit = z.infer<
  typeof ScheduledInternalAuditSchema
>;

export async function getInternalAuditList() {
  const res = await axios.get("/api/internal-audit");
  return res.data;
}

export const updateInternalAudit = async (
  internalAuditRequest: Partial<ScheduledInternalAudit>
) => {
  const formData = new FormData();

  Object.keys(internalAuditRequest).forEach((key) => {
    const value = internalAuditRequest[key as keyof ScheduledInternalAudit];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, JSON.stringify(item));
      });
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/internal-audit", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const deleteInternalAudit = async (id: number) => {
  const res = await axios.delete(`/api/internal-audit/${id}/delete`);
  return res.data;
};

export async function getInternalAuditFormsList() {
  const res = await axios.get("/api/question-reports");
  return res.data;
}

export async function createInternalAuditForm(data: Partial<InternalAudit>) {
  const res = await axios.post("/api/question-reports", {
    ...data,
  });
  return res.data;
}

export async function updateInternalAuditForm({
  id,
  data,
}: {
  id: string;
  data: Partial<InternalAudit>;
}) {
  const res = await axios.post(`/api/question-reports/${id}/update`, {
    ...data,
  });
  return res.data;
}

export async function deleteInternalAuditForm({ id }: { id: string }) {
  const res = await axios.delete(`/api/question-reports/${id}/delete`);
  return res.data;
}

export async function getScheduledInternalAuditList() {
  const res = await axios.get("/api/internal-audit");
  return res.data;
}

export async function getFactoryList() {
  const res = await axios.get("/api/audit-factory");
  return res.data;
}

export async function createFactory(data: Partial<Factory>) {
  const res = await axios.post("/api/audit-factory", data);
  return res.data;
}

export async function getProcessTypeList() {
  const res = await axios.get("/api/process-types");
  return res.data;
}

export async function createProcessType(data: Partial<ContactPerson>) {
  const res = await axios.post("/api/process-types", data);
  return res.data;
}

export async function getContactPersonList() {
  const res = await axios.get("/api/contact-people");
  return res.data;
}

export async function createContactPerson(data: Partial<ContactPerson>) {
  const res = await axios.post("/api/contact-people", data);
  return res.data;
}

export async function createDraftScheduledInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post("/api/internal-audit-draft", {
    ...data,
  });
  return res.data;
}

export async function updateDraftScheduledInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post(`/api/internal-audit-draft/${data.id}/update`, {
    ...data,
  });
  return res.data;
}

export async function createScheduledInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post("/api/internal-audit-scheduled", {
    ...data,
  });
  return res.data;
}

export async function updateScheduledInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post(
    `/api/internal-audit-scheduled/${data.id}/update`,
    {
      ...data,
    }
  );
  return res.data;
}

export async function updateOngoingInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post(
    `/api/internal-audit-ongoing/${data.id}/update`,
    {
      ...data,
    }
  );
  return res.data;
}

export async function completeInternalAudit(
  data: Partial<ScheduledInternalAudit>
) {
  const res = await axios.post(
    `/api/internal-audit-completed/${data.id}/update`,
    {
      ...data,
    }
  );
  return res.data;
}

export async function createActionPlan(
  data: Partial<ScheduledInternalAuditActionPlan>
) {
  const res = await axios.post(`/api/internal-audit-action-plan`, {
    ...data,
  });
  return res.data;
}

export async function updateActionPlan(
  data: Partial<ScheduledInternalAuditActionPlan>
) {
  const res = await axios.post(
    `/api/internal-audit-action-plan/${data.actionPlanId}/update`,
    {
      ...data,
    }
  );
  return res.data;
}

export async function deleteActionPlan({ id }: { id: string }) {
  const res = await axios.delete(
    `/api/internal-audit-action-plan/${id}/delete`
  );
  return res.data;
}
