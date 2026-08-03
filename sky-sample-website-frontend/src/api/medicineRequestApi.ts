import axios from "axios";
import { z } from "zod";
import { userSchema } from "./userApi";

export const MedicineRequestSchema = z.object({
  id: z.string(),
  approver: userSchema,
  approverId: z.number(),
  createdAt: z.string(),
  division: z.string(),
  genericName: z.string(),
  medicineName: z.string(),
  medicineId: z.string(),
  publishedAt: z.string(),
  referenceNumber: z.string(),
  requestDate: z.string(),
  requestQuantity: z.string(),
  status: z.string(),
  updatedAt: z.string().optional(),
  created_at: z.string(),
});

export type MedicineRequest = z.infer<typeof MedicineRequestSchema>;

export async function getMedicineList() {
  const res = await axios.get("/api/medicine-request");
  return res.data;
}

export async function getMedicineAssignedTaskList() {
  const res = await axios.get("/api/medicine-request-assign-task");
  return res.data;
}

export async function approveMedicineRequest({ id }: { id: string }) {
  const res = await axios.post(`/api/medicine-request/${id}/approve`);
  return res.data;
}

export const createMedicine = async (medicineRequest: MedicineRequest) => {
  const formData = new FormData();

  Object.keys(medicineRequest).forEach((key) => {
    const value = medicineRequest[key as keyof MedicineRequest];

    if (key === "documents" && Array.isArray(value)) {
      value.forEach((file, index) => {
        formData.append(`documents[${index}]`, file);
      });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, JSON.stringify(item));
      });
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/medicine-request", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateMedicine = async (medicineRequest: MedicineRequest) => {
  if (!medicineRequest.id) {
    throw new Error("Patient must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(medicineRequest).forEach((key) => {
    const value = medicineRequest[key as keyof MedicineRequest];

    if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  try {
    const response = await axios.post(
      `/api/medicine-request/${medicineRequest.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating patient record:", error);
    throw error;
  }
};

export const deleteMedicine = async (id: string) => {
  const res = await axios.delete(`/api/medicine-request/${id}/delete`);
  return res.data;
};
