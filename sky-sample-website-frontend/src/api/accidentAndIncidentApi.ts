import axios from "axios";
import { z } from "zod";
import { userSchema } from "./userApi";
import { StorageFileSchema } from "../utils/StorageFiles.util";

export enum Severity {
  MINOR = "Minor",
  MAJOR = "Major",
}

export enum IncidentSeverity {
  LOW = "Low",
  MEDIUM = "Medium",
  HIGH = "High",
  VERY_HIGH = "Very High",
  EXTREME = "Extreme",
}

export enum IncidentTypeOfNearMiss {
  NEAR_MISS = "Near Miss",
  OTHER = "Other",
  SAFETY_CONCERN = "Safety Concern",
  SAFETY_IDEA_SUGGESTION = "Safety Idea/Suggestion",
}

export enum IncidentTypeOfConcern {
  AREA = "Area",
  OTHER = "Other",
  SAFETY_POLICY_VIOLATION = "Safety Policy Violation",
  UNSAFE_ACT = "Unsafe Act",
  UNSAFE_CONDITION = "Unsafe Condition",
  UNSAFE_CONDITION_OF_EQUIPMENT = "Unsafe Condition of Equipment",
  UNSAFE_USE_OF_EQUIPMENT = "Unsafe Use of Equipment",
}

export enum IncidentFactors {
  ENVIRONMENTAL = "Environmental",
  EQUIPMENT_TOOLS = "Equipment and Tools",
  EXTERNAL = "External",
  HUMAN = "Human",
  ORGANIZATIONAL = "Organizational",
  PROCEDURAL_ISSUES = "Procedural Issues",
}

export enum InjuryType {
  FIRST_AID = "First Aid",
  REPORTABLE_ACCIDENT = "Reportable Accident",
  NON_REPORTABLE_ACCIDENT = "Non-Reportable Accident",
}

export enum BodyPrimaryRegion {
  ADDITIONAL = "Additional",
  BACK = "Back",
  LOWER_LIMBS = "Lower Limbs",
  LOWER_BODY = "Lower Body",
  UPPER_LIMBS = "Upper Limbs",
  UPPER_BODY = "Upper Body",
  HEAD_AND_FACE = "Head and Face",
}

export const AccidentWitnessSchema = z.object({
  employeeId: z.string(),
  name: z.string(),
  company: z.string(),
  division: z.string(),
  department: z.string(),
  evidenceName: z.string().optional(),
});

export type AccidentWitness = z.infer<typeof AccidentWitnessSchema>;

export const AccidentEffectedIndividualSchema = z.object({
  id: z.string(),
  personId: z.number(),
  personType: z.string(),
  employeeId: z.string(),
  name: z.string(),
  gender: z.string(),
  age: z.string(),
  dateOfJoin: z.date(),
  industryExperience: z.string(),
  designation: z.string(),
  employmentDuration: z.string(),
});

export type AccidentEffectedIndividual = z.infer<
  typeof AccidentEffectedIndividualSchema
>;

export const AccidentSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  accidentDate: z.date(),
  accidentTime: z.date(),
  severity: z.nativeEnum(Severity),
  division: z.string(),
  department: z.string(),
  location: z.string(),
  supervisorName: z.string(),
  reportedDate: z.string(),
  orgId: z.string(),
  evidenceType: z.string().optional(),
  evidenceName: z.string().optional(),
  evidenceId: z.string().nullable(),
  evidence: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  status: z.string(),
  assigneeNotification: z.boolean(),
  resolution: z.string(),
  investigation: z.string().nullable(),
  category: z.string(),
  subCategory: z.string(),
  accidentType: z.string(),
  affectedBodyParts: z.string().optional(),
  injuryType: z.nativeEnum(InjuryType),
  injuryCause: z.string(),
  consultedHospital: z.string(),
  consultedDoctor: z.string(),
  timeOfWork: z.string(),
  returnForWork: z.string().nullable(),
  completedNotification: z.boolean(),
  injury: z.string(),
  groupNotification: z.boolean(),
  workPerformed: z.string(),
  description: z.string(),
  actionTaken: z.string(),
  atmosphereCondition: z.string().nullable(),
  lightningCondition: z.string().nullable(),
  workSurfaceCondition: z.string().nullable(),
  housekeepingCondition: z.string().nullable(),
  damage: z.string().nullable(),
  disease: z.string().nullable(),
  environmental: z.string().nullable(),
  training: z.string().nullable(),
  lesson: z.string().nullable(),
  govReported_date: z.string().nullable(),
  esiReported_date: z.string().nullable(),
  amount: z.string(),
  consequenceCategory: z.string(),
  returnForWorkHour: z.string().nullable(),
  returnForWorkMin: z.string().nullable(),
  returnDate: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string(),
  affectedPrimaryRegion: z.string(),
  affectedSecondaryRegion: z.string(),
  affectedTertiaryRegion: z.string(),
  rootCause: z.string().nullable(),
  assignee: userSchema.optional(),
  assigneeId: z.number().optional(),
  witnesses: z.array(AccidentWitnessSchema),
  effectedIndividuals: z.array(AccidentEffectedIndividualSchema),
  imageUrl: z.string().optional(),
  reporter: z.string(),
  createdByUser: z.string(),
  removeDoc: z.array(z.string()).optional(),
});

export type Accident = z.infer<typeof AccidentSchema>;

export const IncidentSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  incidentDate: z.date(),
  incidentTime: z.date(),
  severity: z.nativeEnum(IncidentSeverity),
  division: z.string(),
  location: z.string(),
  supervisorName: z.string(),
  reportedDate: z.string(),
  orgId: z.string(),
  evidenceType: z.string().optional(),
  evidenceName: z.string().optional(),
  evidenceId: z.string().nullable(),
  evidence: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  status: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string(),
  assignee: userSchema.optional(),
  assigneeId: z.number().optional(),
  witnesses: z.array(AccidentWitnessSchema),
  effectedIndividuals: z.array(AccidentEffectedIndividualSchema),
  reporter: z.string(),
  imageUrl: z.string().optional(),
  circumstances: z.string(),
  incidentDetails: z.string().optional(),
  typeOfNearMiss: z.nativeEnum(IncidentTypeOfNearMiss),
  typeOfConcern: z.nativeEnum(IncidentTypeOfConcern),
  factors: z.nativeEnum(IncidentFactors),
  causes: z.string().optional(),
  createdByUser: z.number(),
  removeDoc: z.array(z.string()).optional(),
});

export type Incident = z.infer<typeof IncidentSchema>;

export async function getAccidentsList() {
  const res = await axios.get("/api/accidents");
  return res.data;
}

export async function getAccidentsAssignedTaskList() {
  const res = await axios.get("/api/accidents-assign-task");
  return res.data;
}

export const createAccident = async (accident: Accident) => {
  const formData = new FormData();
  Object.keys(accident).forEach((key) => {
    const value = accident[key as keyof typeof accident];

    if (key === "evidence" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "witnesses" || key === "effectedIndividuals") {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey]?.toString()
            );
          });
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/accidents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateAccident = async (accident: Accident) => {
  const formData = new FormData();

  Object.keys(accident).forEach((key) => {
    const value = accident[key as keyof typeof accident];

    if (key === "evidence" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "witnesses" || key === "effectedIndividuals") {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey].toString()
            );
          });
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });
  const res = await axios.post(
    `/api/accidents/${accident.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const deleteAccident = async (id: string) => {
  const res = await axios.delete(`/api/accidents/${id}/delete`);
  return res.data;
};

//Incident Apis
export async function getIncidentsList() {
  const res = await axios.get("/api/incidents");
  return res.data;
}

export async function getIncidentsAssignedTaskList() {
  const res = await axios.get("/api/incidents-assign-task");
  return res.data;
}

export const createIncidents = async (incidents: Incident) => {
  const formData = new FormData();

  Object.keys(incidents).forEach((key) => {
    const value = incidents[key as keyof typeof incidents];

    if (key === "evidence" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "witnesses" || key === "effectedIndividuals") {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey].toString()
            );
          });
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/incidents", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateIncident = async (incident: Incident) => {
  const formData = new FormData();

  // Append each property of the incident object to the form data
  Object.keys(incident).forEach((key) => {
    const value = incident[key as keyof typeof incident];

    if (key === "evidence" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`evidence[${index}]`, file as File);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "witnesses" || key === "effectedIndividuals") {
          Object.keys(item).forEach((nestedKey) => {
            formData.append(
              `${key}[${index}][${nestedKey}]`,
              item[nestedKey]?.toString()
            );
          });
        } else {
          formData.append(`${key}[${index}]`, JSON.stringify(item));
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post(
    `/api/incidents/${incident.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const deleteIncident = async (id: string) => {
  const res = await axios.delete(`/api/incidents/${id}/delete`);
  return res.data;
}; //push
