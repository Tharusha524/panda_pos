import { z } from "zod";
import { userSchema } from "../userApi";
import { StorageFileSchema } from "../../utils/StorageFiles.util";
import axios from "axios";

export enum ZdhcUseCategory {
  OTHERS = "Others",
  WEIGHTING_AGENTS = "Weighting Agent",
  VAT_DYE = "Vat Dye",
  UV_PROTECTION = "UV Protection",
  SULPHUR_DYE = "Sulphur Dye",
  STORAGE_STABILITY = "Storage Stability",
  STABILIZERS = "Stabilizers",
  SPOTTING_AGENTS = "Spotting Agent",
  SPINNING_SOLUTION_ADDITIVES = "Spinning Solution Additives",
  SPINNING_BATH_ADDITIVES = "Spinning Bath Additives",
  SPINNING_ADDICTIVES = "Spinning Addictives",
  SOIL_RELEASE_AGENTS = "Soil Release Agent",
  SOFTING_AGENTS = "Softening Agent",
  SOAPING = "Soaping",
  SIZING_AGENTS_AND_SIZING_ADDITIVES = "Sizing Agents and Sizing Additives",
  RESISTANT_AGENTS = "Resistant Agents",
  RESIN_THERMOSENSIBLE = "Resin Thermosensible",
  RESIN_THERMOPLASTIC = "Resin Thermoplastic",
  REACTIVE_DYES = "Reactive Dyes",
  PVC_BASED_PLASTISOLS_READY_TO_USE = "PVC Based Plastisols Ready to Use",
  PRODUCTS_INCREASING_WET_PICK_UP = "Products Increasing Wet Pick Up",
  PRINTING_THICKENERS = "Printing Thickeners",
  PRINTING_AND_EDGE_ADHESIVES = "Printing and Edge Adhesives",
  PRESPOTTING_AGENTS = "Pre-spotting Agent",
  PREPARATION_AGENTS = "Preparation Agent",
  PIGMENTS = "Pigments",
  PH_REGULATORS_ACID_AND_ALKALI_DISPENSERS = "pH Regulators Acid and Alkali Dispensers",
  PADDING_AUXILIARIES = "Padding Auxiliaries",
  OXIDIZING_AGENTS = "Oxidizing Agent",
  OTHER_PIGMANT_BASED_READY_TO_USER_PRINTING_PASTES = "Other Pigmant Based Ready to User Printing Pastes",
  OTHER_AUXILIARIES = "Other Auxiliaries",
  OTHER_ANCILIARIES = "Other Anciliaries",
  OPTICAL_BRIGHTENERS = "Optical Brighteners",
  NON_SLIP_LADDER_PROOF_AND_ANTI_SNAG_AGENTS = "Non Slip Ladder Proof and Anti Snag Agents",
  MORDANTS = "Mordants",
  MORDANT_DYE = "Mordant Dye",
  METAL_COMPLEX_DYES = "Metal Complex Dyes",
  MERCERISING_AND_CAUSTICIZING_AUXILIARIES = "Mercerising and Causticizing Auxiliaries",
  LUSTRING_AGENTS = "Lustring Agents",
  LUBRICANTS = "Lubricants",
  LEVELING_AGENTS = "Leveling Agent",
  LAMINATING_AGENTS = "Laminating Agents",
  KIERBOILING_SCOURING_AUXILIARIES = "Kierboiling Scouring Auxiliaries",
  HYDROPHILIZING_AGENTS = "Hydrophilizing Agents",
  HANDLE_IMPARTING_AGENTS = "Handle Imparting Agents",
  FLAME_RETARDANTS = "Flame Retardants",
  FIX_ACCELARATORS_FOR_CONTINUOUS_DYEING = "Fix Accelerators for Continuous Dyeing",
  FINISHING = "Finishing",
  FILLING_AND_STIFENING_AGENTS = "Filling and Stifening Agents",
  FIBRE_PROACTIVE_AGENTS_IN_DYEING = "Fibre Proactive Agents in Dyeing",
  FIBER_PROTECTING_AGENTS_IN_PRETREATMENT = "Fiber Protecting Agents in Pretreatment",
  FELTING_AGENT = "Felting Agent",
  EMULSIFIERS_FOR_GASOLINE_PRINTING = "Emulsifiers for Gasoline Printing",
  DYESTUFF_SOLUBILIZING_AND_HYDROTROPIC_AGENTS = "Dyestuff Solubilizing and Hydrotropic Agents",
  DYESTUFF_PROTECTING_AGENTS = "Dyestuff Protecting Agents",
  DYEING_WETTING_AGENTS = "Dyeing Wetting Agent",
  DEARATION_AGENTS = "Dearation Agents",
  DRY_CLEANING_DETERGENTS = "Dry cleaning Detergents",
  DISPERSING_AGENTS_AND_PROTECTIVE_COLLOIDS = "Dispersing Agents and Protective Colloids",
  DISPERSE_DYES = "Disperse Dyes",
  DISCHARGING_AGENTS_AND_DISCHARGING_ASSISTANTS = "Discharging Agents and Discharging Assistants",
  DIRECT_DYES = "Direct Dyes",
  DETERGENTS_DISPERSING_AND_EMULSIFYING_AGENTS = "Detergents Dispersing and Emulsifying Agents",
  WETTING_AGENTS = "Wetting Agent",
  WATER_BASED_READY_TO_USER_PRINTING_PASTES = "Water Based Ready to User Printing Pastes",
  WATER_STAIN_AND_OIL_REPELLENT = "Water Stain and Oil Repellent",
  DESIZING_AGENTS = "Desizing Agents",
  DELUSTERING_AGENTS = "Delustering Agents",
  DEFOAMING_AGENTS_FOR_SOLVENT_APPLICATION = "Defoaming Agents for Solvent Application",
  CREASE_PREVENTING_AGENTS = "Crease Preventing Agents",
  CONING_OILS_WRAPPING_AND_TWISTING_OILS = "Coning Oils Wrapping and Twisting Oils",
  CONDITIONING_AGENTS = "Conditioning Agents",
  COATING_AGENTS_AS_WELL_AS_ACCORDING_ADDITIVES = "Coating Agents as well as according additives",
  CLEANING_MAINTENANCE_PRODUCTS = "Cleaning Maintenance Products",
  CHELATING_AGENTS = "Chelating Agents",
  CATALYSTS_FOR_NON_CREASING_AND_NON_SHRINKING_FINISHES = "Catalysts for Non Creasing and Non Shrinking Finishes",
  CARRIERS = "Carriers",
  CARBONIZING_ASSISTANTS = "Carbonizing Assistants",
  BRIGHTENING_AND_STRIPPING_AGENTS = "Brightening and Stripping Agents",
  BONDING_AGENT_BINDERS_FOR_PIGMENT_DYEING = "Bonding Agent Binders for Pigment Dyeing",
  BLEACHING_AUXILIARIES = "Bleaching Auxiliaries",
  BASIC_DYE_CATIONIC_DYE = "Basic Dy (Cationic Dye)",
  ANTI_MIGRATION_AGENTS = "Anti Migration Agents",
  ANTI_MICROBIOTIC = "Anti Microbiotic",
  ANTI_FROSTING_AUXILIARIES = "Anti Frosting Auxiliaries",
  ANTI_FOAMING_AGENTS = "Anti Foaming Agents",
  ANTI_FELTING_AGENTS = "Anti Felting Agents",
  ANTI_ELECTROSTATIC_AGENTS = "Anti Electrostatic Agents",
  AGENTS_TO_REMOVE_PRINTING_THICKENERS = "Agents to remove printing thickeners",
  AGENTS_TO_PROTECT_TEXTILES_AGAINTS_DAMAGE = "Agents to protect textiles against damage",
  AGENTS_FOR_THE_IMPROVEMENT_OF_CREASE_RESISTANCE = "Agents for the improvement of crease resistance",
  AGENTS_AND_ADDITIVES_TO_PROMOTE_BONDING = "Agents and additives to promote bonding",
  AFTERTREATMENT_AGENTS_FOR_FASTNESS_IMPROVEMENT = "Aftertreatment Agents for Fastness Improvement",
  ADHESIVES = "Adhesives",
  ADDITIVES_FOR_NON_CREASING_AND_NON_SHRINKING_FINISHES = "Additives for Non Creasing and Non Shrinking Finishes",
  ACID_DYES = "Acid Dyes",
}

export enum UseOfPpe {
  CRYOGENIC_GLOVES = "Cryogenic Gloves",
  CUT_RESISTANT_GLOVES = "Cut Resistant Gloves",
  LEATHER_GLOVES = "Leather Gloves",
  DUST_MASK = "Dust Mask",
  POWERED_AIR_PURIFYING_RESPIRATOR = "Powered Air Purifying Respirator",
  CHEMICAL_SPLASH_GOGGLES = "Chemical Splash Goggles",
  GAS_MASKS = "Gas Masks",
  FULL_FACE_RESPIRATORS = "Full Face Respirators",
  N95_RESPIRATOR_MASK = "N95 Respirator Mask",
}

export enum HazardType {
  ENVIRONMENTAL_HAZARD = "Environmental Hazard",
  PHYSICAL_HAZARD = "Physical Hazard",
  HEALTH_HAZARD = "Health Hazard",
}

export enum ChemicalRequestStatus {
  DRAFT = "draft",
  APPROVED = "approved",
  PUBLISHED = "published",
}

export const ProductStandardSchema = z.object({
  id: z.string(),
  productStandard: z.string(),
});

export type ProductStandard = z.infer<typeof ProductStandardSchema>;

export const ChemicalSchema = z.object({
  id: z.string(),
  commercialName: z.string(),
  substanceName: z.string().optional(),
  molecularFormula: z.string().optional(),
  chemicalFormType: z.string(),
  reachRegistrationNumber: z.string().optional(),
  zdhcCategory: z.string(),
  whereAndWhyUse: z.string().optional(),
  zdhcLevel: z.string(),
  casNumber: z.string().optional(),
  colourIndex: z.string().optional(),
  useOfPPE: z.array(z.string()),
  hazardType: z.array(z.string()),
  ghsClassification: z.string(),
});

export type Chemical = z.infer<typeof ChemicalSchema>;

export const ChemicalTestLabSchema = z.object({
  id: z.string(),
  laboratoryName: z.string(),
});

export type ChemicalTestLab = z.infer<typeof ChemicalTestLabSchema>;

export const ChemicalTestPositiveListSchema = z.object({
  id: z.string(),
  name: z.string(),
});

export type ChemicalTestPositiveList = z.infer<
  typeof ChemicalTestPositiveListSchema
>;

export const chemicalTestSchema = z.object({
  id: z.string(),
  name: z.string(),
  test_date: z.date(),
  testing_lab: ChemicalTestLabSchema,
  issued_date: z.date(),
  expiry_date: z.date(),
  positive_list: ChemicalTestPositiveListSchema,
  description: z.string(),
  documents: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
});

export const ChemicalRequestSchema = z.object({
  id: z.string(),
  referenceNumber: z.string(),
  requestDate: z.date(),
  commercialName: z.string(),
  substanceName: z.string().optional(),
  molecularFormula: z.string().optional(),
  reachRegistrationNumber: z.string().optional(),
  zdhcCategory: z.string(),
  whereAndWhyUse: z.string(),
  division: z.string(),
  requestedCustomer: z.string(),
  requestedMerchandiser: z.string().optional(),
  status: z.nativeEnum(ChemicalRequestStatus),
  requestQuantity: z.number(),
  requestUnit: z.string(),
  created_at: z.string(),
  updatedAt: z.string(),
  publishedAt: z.string(),
  zdhcLevel: z.string(),
  casNumber: z.string(),
  colourIndex: z.string().optional(),
  useOfPPE: z.string(),
  hazardType: z.string(),
  ghsClassification: z.string(),
  chemicalFormType: z.string(),
  productStandard: z.string().optional(),
  msdsorsdsIssuedDate: z.date().nullable(),
  msdsorsdsExpiryDate: z.date().nullable(),
  doYouHaveMSDSorSDS: z.boolean(),
  documents: z
    .array(z.union([z.instanceof(File), StorageFileSchema]))
    .optional(),
  created_date: z.string(),
  reviewer: userSchema,
  reviewerId: z.number().nullable(),
  removeDoc: z.array(z.string()).optional(),
});

export type ChemicalRequest = z.infer<typeof ChemicalRequestSchema>;

export const ChemicalCertificateSchema = z.object({
  inventoryId: z.number().nullable(),
  id: z.number().nullable(),
  certificateId: z.number().nullable(),
  testName: z.string().nullable(),
  testDate: z.date().nullable(),
  testLab: z.string().nullable(),
  issuedDate: z.date().nullable(),
  expiryDate: z.date().nullable(),
  positiveList: z.string().nullable(),
  description: z.string().nullable(),
  documents: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  previewDocuments: z
    .union([z.array(StorageFileSchema), z.array(z.instanceof(File))])
    .optional(),
  removeDoc: z.array(z.string()).optional(),
  removeCertificate: z.array(z.string()),
});

export type ChemicalCertificate = z.infer<typeof ChemicalCertificateSchema>;

export const ChemicalPurchaseRequestSchema = z.object({
  id: z.string(),
  referenceNumber: z.string().nullable(),
  inventoryNumber: z.string().nullable(),
  commercialName: z.string().nullable(),
  substanceName: z.string().nullable(),
  reachRegistrationNumber: z.string().nullable(),
  molecularFormula: z.string().nullable(),
  requestQuantity: z.number().nullable(),
  requestUnit: z.string().nullable(),
  zdhcCategory: z.string().nullable(),
  chemicalFormType: z.string().nullable(),
  whereAndWhyUse: z.string().nullable(),
  productStandard: z.string().nullable(),
  doYouHaveMSDSorSDS: z.boolean().nullable(),
  msdsorsdsIssuedDate: z.date().nullable(),
  msdsorsdsExpiryDate: z.date().nullable(),
  documents: z.array(z.unknown()).nullable(),
  division: z.string().nullable(),
  requestedCustomer: z.string().nullable(),
  requestedMerchandiser: z.string().nullable(),
  requestDate: z.string().nullable(),
  reviewerId: z.string().nullable(),
  approverId: z.string().nullable(),
  hazardType: z.array(z.string()).nullable(),
  useOfPPE: z.array(z.string()).nullable(),
  ghsClassification: z.string().nullable(),
  zdhcLevel: z.string().nullable(),
  casNumber: z.string().nullable(),
  colourIndex: z.string().nullable(),
  status: z.nativeEnum(ChemicalRequestStatus),
  createdByUser: userSchema,
  updatedBy: userSchema,
  approvedBy: userSchema,
  rejectedBy: z.string().nullable(),
  responsibleSection: z.string().nullable().default("ChemicalManagement"),
  assigneeLevel: z.string().nullable().default("1"),
  type: z.string().nullable(),
  name: z.string().nullable(),
  manufactureName: z.string().nullable(),
  contactNumber: z.string().nullable(),
  emailId: z.string().nullable(),
  location: z.string().nullable(),
  compliantWithTheLatestVersionOfZDHCandMRSL: z.string().nullable(),
  apeoOrNpeFreeComplianceStatement: z.string().nullable(),
  manufacturingDate: z.date().nullable(),
  expiryDate: z.date().nullable(),
  deliveryDate: z.string().nullable(),
  deliveryQuantity: z.number().nullable(),
  deliveryUnit: z.string().nullable(),
  purchaseAmount: z.number().nullable(),
  thresholdLimit: z.string().nullable(),
  invoiceDate: z.string().nullable(),
  invoiceReference: z.string().nullable(),
  hazardStatement: z.string().nullable(),
  storageConditionRequirements: z.string().nullable(),
  storagePlace: z.string().nullable(),
  lotNumber: z.string().nullable(),
  certificate: z.array(ChemicalCertificateSchema),
  removeDoc: z.array(z.string()).optional(),
  removeCertificate: z.array(z.number()),
  approverName: userSchema,
});

export type ChemicalPurchaseRequest = z.infer<
  typeof ChemicalPurchaseRequestSchema
>;

export async function fetchChemicalRequests() {
  const res = await axios.get(`/api/chemical-records`);
  return res.data;
}

export async function fetchChemicalCommercialNames() {
  const res = await axios.get(`/api/commercial-names`);
  return res.data;
}

export async function createChemical(data: { data: Partial<Chemical> }) {
  const res = await axios.post(`/api/commercial-names`, {
    ...data,
  });
  return res.data;
}

export async function createProductStandard(data: {
  data: Partial<ProductStandard>;
}) {
  const res = await axios.post(`/api/product-standard`, {
    ...data,
  });
  return res.data;
}

export async function fetchProductStandards() {
  const res = await axios.get(`/api/product-standard`);
  return res.data;
}

export const createChemicalRequest = async ({
  data,
}: {
  data: Partial<ChemicalRequest>;
}) => {
  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof ChemicalRequest];

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
    const response = await axios.post(`/api/chemical-records`, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    return response.data;
  } catch (error) {
    console.error("Error updating Chemical Records:", error);
    throw error;
  }
};

export const updateChemicalRequest = async ({
  data,
}: {
  data: Partial<ChemicalRequest>;
}) => {
  if (!data.id) {
    throw new Error("Chemical Request must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof ChemicalRequest];

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
      `/api/chemical-records/${data.id}/update`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating chemical request:", error);
    throw error;
  }
};

export const approveChemicalRequest = async ({
  data,
}: {
  data: Partial<ChemicalRequest>;
}) => {
  if (!data.id) {
    throw new Error("Chemical Request must have an ID for an update.");
  }

  const formData = new FormData();
  Object.keys(data).forEach((key) => {
    const value = data[key as keyof ChemicalRequest];

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
      `/api/chemical-records/${data.id}/approve`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    return response.data;
  } catch (error) {
    console.error("Error updating chemical request:", error);
    throw error;
  }
};

export const deleteChemicalRequest = async (id: string) => {
  const res = await axios.delete(`/api/chemical-records/${id}/delete`);
  return res.data;
};

export async function fetchChemicalPurchaceInventories() {
  const res = await axios.get(`/api/purchase-inventory-records`);
  return res.data;
}

export async function fetchAllSupplierNames() {
  const res = await axios.get("/api/chemical-supplier-names");
  return res.data;
}

export async function fetchTestingLabsData() {
  const res = await axios.get("/api/testing-labs");
  return res.data;
}

export async function createTestLab(data: Partial<ChemicalTestLab>) {
  const res = await axios.post("/api/testing-labs", data);
  return res.data;
}

export async function fetchPositiveList() {
  const res = await axios.get("/api/positive-list");
  return res.data;
}

export async function createPositiveList(
  data: Partial<ChemicalTestPositiveList>
) {
  const res = await axios.post("/api/positive-list", data);
  return res.data;
}

export const updateChemicalPurchaseInventory = async (
  chemicalPurchaseInventory: ChemicalPurchaseRequest
) => {
  const processed = { ...chemicalPurchaseInventory };

  ["hazardType", "useOfPPE"].forEach((key) => {
    if (processed[key]) {
      try {
        let value = processed[key];
        value = typeof value === "string" ? JSON.parse(value) : value;
        processed[key] = Array.isArray(value)
          ? value.map((item: string) => item.replace(/^"|"$/g, ""))
          : [];
        console.log("passed", processed);
      } catch (error) {
        console.log(`Failed to parse ${key}:`, processed[key]);
        processed[key] = [];
      }
    }
  });
  const formData = new FormData();

  Object.keys(processed).forEach((key) => {
    const value = processed[key as keyof typeof processed];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "documents") {
          (item as File) &&
            formData.append(`documents[${index}]`, item as File);
        } else if (key === "certificate") {
          const certificateItem = item as Record<string, any>;

          const hasOldDocuments =
            Array.isArray(certificateItem.documents) &&
            certificateItem.documents.some(
              (doc: any) =>
                doc.gsutil_uri || doc.imageUrl || doc.file_name || doc.fileName
            );

          if (hasOldDocuments) {
            return;
          }

          Object.keys(certificateItem).forEach((nestedKey) => {
            if (
              nestedKey === "documents" &&
              Array.isArray(certificateItem[nestedKey])
            ) {
              certificateItem[nestedKey].forEach(
                (doc: File | Blob, docIndex: number) => {
                  formData.append(
                    `certificate[${index}][documents][${docIndex}]`,
                    doc
                  );
                }
              );
            } else {
              const value = certificateItem[nestedKey];
              formData.append(
                `certificate[${index}][${nestedKey}]`,
                value instanceof Date ? value.toISOString() : value?.toString()
              );
            }
          });
        } else {
          formData.append(
            `${key}[${index}]`,
            typeof item === "string" ? item : JSON.stringify(item)
          );
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post(
    `/api/purchase-inventory-records/${chemicalPurchaseInventory.id}/update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const publishChemicalPurchase = async (
  chemicalPurchaseInventory: ChemicalPurchaseRequest
) => {
  const processed = { ...chemicalPurchaseInventory };

  ["hazardType", "useOfPPE"].forEach((key) => {
    if (processed[key]) {
      try {
        let value = processed[key];
        value = typeof value === "string" ? JSON.parse(value) : value;
        processed[key] = Array.isArray(value)
          ? value.map((item: string) => item.replace(/^"|"$/g, ""))
          : [];
        console.log("passed", processed);
      } catch (error) {
        console.log(`Failed to parse ${key}:`, processed[key]);
        processed[key] = [];
      }
    }
  });
  const formData = new FormData();

  Object.keys(processed).forEach((key) => {
    const value = processed[key as keyof typeof processed];

    if (Array.isArray(value)) {
      value.forEach((item, index) => {
        if (key === "documents") {
          (item as File) &&
            formData.append(`documents[${index}]`, item as File);
        } else if (key === "certificate") {
          const certificateItem = item as Record<string, any>;

          const hasOldDocuments =
            Array.isArray(certificateItem.documents) &&
            certificateItem.documents.some(
              (doc: any) =>
                doc.gsutil_uri || doc.imageUrl || doc.file_name || doc.fileName
            );

          if (hasOldDocuments) {
            return;
          }

          Object.keys(certificateItem).forEach((nestedKey) => {
            if (
              nestedKey === "documents" &&
              Array.isArray(certificateItem[nestedKey])
            ) {
              certificateItem[nestedKey].forEach(
                (doc: File | Blob, docIndex: number) => {
                  formData.append(
                    `certificate[${index}][documents][${docIndex}]`,
                    doc
                  );
                }
              );
            } else {
              const value = certificateItem[nestedKey];
              formData.append(
                `certificate[${index}][${nestedKey}]`,
                value instanceof Date ? value.toISOString() : value?.toString()
              );
            }
          });
        } else {
          formData.append(
            `${key}[${index}]`,
            typeof item === "string" ? item : JSON.stringify(item)
          );
        }
      });
    } else if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (value !== null && value !== undefined) {
      formData.append(key, value.toString());
    }
  });

  const res = await axios.post(
    `/api/purchase-inventory-records/${chemicalPurchaseInventory.id}/publish-update`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );

  return res.data;
};

export const deleteChemicalPurchaseRequest = async (id: string) => {
  console.log("id", id);
  const res = await axios.delete(`/api/purchase-inventory-record/${id}/delete`);
  return res.data;
};

export async function fetchChemicalTransactionPublished() {
  const res = await axios.get(`/api/chemical-transaction-published`);
  return res.data;
}

export async function fetchChemicalAssignedRequest() {
  const res = await axios.get(`/api/purchase-inventory-records-assign-task`);
  return res.data;
}
