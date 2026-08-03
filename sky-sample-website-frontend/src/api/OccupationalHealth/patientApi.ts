import axios from "axios";
import { z } from "zod";

export enum Gender {
  MALE = "Male",
  FEMALE = "Female",
  OTHER = "Other",
}

export enum Designation {
  SENOR_MANAGER = "Senior Manager",
  GENERAL_MANAGER = "General Manager",
  EXECUTIVE_DIRECTOR = "Executive Director",
  QUALITY_CONTROLLER = "Quality Controller",
  POLYMAN = "Polyman",
  IRONER = "Ironer",
  JUNIOR_IRONER = "Junior Ironer",
  STORE_KEEPER = "Store Keeper",
  SAMPLE_MAN = "Sample Man",
  JR_QUALITY_INSPECTOR = "Junior Quality Inspector",
  MACHINE_OPERATOR = "Machine Operator",
  DRY_PROCESS_TECHNICIAN = "Dry Process Technician",
  JUNIOR_OPERATOR = "Junior Operator",
  PRODUCTION_REPORTER = "Production Reporter",
  HELPER = "Helper",
  INCHARGE = "Incharge",
  ECR_MANAGER = "ECR Manager",
  MANAGER = "Manager",
  QUALITY_INSPECTOR = "Quality Inspector",
}

export enum WorkStatus {
  ON_DUTY = "OnDuty",
  OFF_DUTY = "OffDuty",
}

export const DoctorSchema = z.object({
  id: z.string(),
  first_name: z.string(),
  last_name: z.string(),
  designation: z.string(),
  org_id: z.string(),
  email: z.string(),
  escalate_email: z.string(),
  hse_head: z.boolean(),
  gender: z.string(),
  employee_id: z.string().optional(),
  chairperson: z.boolean(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date(),
  birth_date: z.date().optional(),
  corporate_user: z.boolean(),
  weekly_report: z.boolean(),
});

export type Doctor = z.infer<typeof DoctorSchema>;

export const PatientSchema = z.object({
  id: z.string(),
  employeeName: z.string(),
  employeeId: z.string(),
  designation: z.nativeEnum(Designation),
  gender: z.nativeEnum(Gender),
  department: z.string(),
  age: z.number(),
  subDepartment: z.string(),
  symptoms: z.string(),
  checkInTime: z.date(),
  checkOut: z.date().optional(),
  checkInDate: z.date(),
  checkOutDate: z.date().optional(),
  timeSpent: z.number().optional(),
  bodyTemperature: z.number().optional(),
  weight: z.number().optional(),
  severityLevel: z.number().optional(),
  treatment: z.string().optional(),
  disease: z.string().optional(),
  patientStatus: z.string(),
  followUpDate: z.date().optional(),
  bloodPressure: z.string(),
  division: z.string(),
  clinicDivision: z.string(),
  followUpStatus: z.boolean(),
  medicineStatus: z.string(),
  height: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  publishedAt: z.date(),
  randomBloodSugar: z.string(),
  hospitalName: z.string().optional(),
  hospitalLocation: z.string().optional(),
  doctorPrescription: z.string().optional(),
  admittedDate: z.date().optional(),
  dischargedDate: z.date().optional(),
  sentViaAmbulance: z.string().optional(),
  referToAnotherHospital: z.string().optional(),
  sinceComplaint: z.string().optional(),
  recommendedDuration: z.string().optional(),
  liftUsageRequired: z.string().optional(),
  workStatus: z.nativeEnum(WorkStatus),
  status: z.string(),
  consultingDoctor: z.string(),
  createdBy: z.string(),
});

export type Patient = z.infer<typeof PatientSchema>;

export async function getPatientList() {
  const res = await axios.get("/api/patient-records");
  return res.data;
}

export const createPatient = async (patient: Patient) => {
  const formData = new FormData();

  Object.keys(patient).forEach((key) => {
    const value = patient[key as keyof Patient];

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
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

  const res = await axios.post("/api/patient-records", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updatePatient = async (patient: Patient) => {
  if (!patient.id) {
    throw new Error("Patient must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(patient).forEach((key) => {
    const value = patient[key as keyof Patient];

    if (value instanceof File) {
      formData.append(key, value);
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  try {
    const response = await axios.post(
      `/api/patient-records/${patient.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating hazard risk:", error);
    throw error;
  }
};

export const deletePatient = async (id: string) => {
  const res = await axios.delete(`/api/patient-records/${id}/delete`);
  return res.data;
};
