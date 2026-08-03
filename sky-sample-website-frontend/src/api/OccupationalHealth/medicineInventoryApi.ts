import axios from "axios";
import { z } from "zod";

export const MedicalDisposalSchema = z.object({
  id: z.number(),
  disposalDate: z.string(),
  availableQuantity: z.number(),
  disposalQuantity: z.number(),
  contractor: z.string(),
  cost: z.string(),
  balanceQuantity: z.number(),
});

export const MedicineInventorySchema = z.object({
  id: z.string(),
  medicineName: z.string(),
  genericName: z.string(),
  division: z.string(),
  dosageStrength: z.string().nullable(),
  expiryDate: z.date().nullable(),
  form: z.string().nullable(),
  manufacturerName: z.string().nullable(),
  supplierName: z.string().nullable(),
  supplierContactNumber: z.string().nullable(),
  supplierEmail: z.string().email().nullable(),
  supplierType: z.string().nullable(),
  location: z.string().nullable(),
  manufacturingDate: z.date().nullable(),
  deliveryDate: z.date().nullable(),
  deliveryUnit: z.string().nullable(),
  purchaseAmount: z.string().nullable(),
  thresholdLimit: z.string().nullable(),
  invoiceDate: z.date().nullable(),
  invoiceReference: z.string().nullable(),
  batchNumber: z.string().nullable(),
  unitCost: z.string().nullable(),
  reorderThreshold: z.string().nullable(),
  usageInstruction: z.string().nullable(),
  deliveryQuantity: z.string().nullable(),
  issuedQuantity: z.string().nullable(),
  disposedOfQuantity: z.string().nullable(),
  balanceQuantity: z.string().nullable(),
  approverRemarks: z.string(),
  referenceNumber: z.string(),
  requestedDate: z.string(),
  status: z.string(),
  requestedQuantity: z.number(),
  medicineUuid: z.string(),
  purchaseNotification: z.boolean(),
  requestedBy: z.string(),
  approvedBy: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
  publishedAt: z.string(),
  medicineType: z.string().nullable(),
  approver: z.string().nullable(),
  reporter: z.string().nullable(),
  medicineDisposals: z.array(MedicalDisposalSchema).nullable(),
  businessUnit: z.string().nullable(),
});

export type MedicineInventory = z.infer<typeof MedicineInventorySchema>;

export async function getMedicineInventoriesList() {
  const res = await axios.get("/api/medicine-inventory");
  return res.data;
}

export async function getMedicineInventoriesTransaction() {
  const res = await axios.get("/api/transaction-published");
  return res.data;
}

export const createMedicineInventory = async (
  medicineInventory: MedicineInventory
) => {
  const formData = new FormData();

  // Append each property of the maternity Register object to the form data
  Object.keys(medicineInventory).forEach((key) => {
    const value = medicineInventory[key as keyof typeof medicineInventory];
    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        formData.append(`${key}[${index}]`, JSON.stringify(item));
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post("/api/medicine-inventory", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return res.data;
};

export const updateMedicineInventory = async (
  medicineInventory: MedicineInventory
) => {
  const formData = new FormData();

  // Append each property of the maternity Register object to the form data
  Object.keys(medicineInventory).forEach((key) => {
    const value = medicineInventory[key as keyof typeof medicineInventory];
    if (Array.isArray(value)) {
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
    `/api/medicine-inventory/${medicineInventory.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const publishMedicineInventory = async (
  medicineInventory: MedicineInventory
) => {
  const formData = new FormData();

  // Append each property of the maternity Register object to the form data
  Object.keys(medicineInventory).forEach((key) => {
    const value = medicineInventory[key as keyof typeof medicineInventory];
    if (Array.isArray(value)) {
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
    `/api/medicine-inventory/${medicineInventory?.id}/publish`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const deleteMedicineInventory = async (id: string) => {
  const res = await axios.delete(`/api/medicine-inventory/${id}/delete`);
  return res.data;
};
