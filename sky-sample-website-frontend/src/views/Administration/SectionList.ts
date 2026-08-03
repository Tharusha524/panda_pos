import { z } from "zod";

export const PermissionSectionsMap: PermissionSection[] = [
  {
    mainSection: "Main",
    subSections: [
      {
        name: "Insight",
        key: "INSIGHT",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
    ],
  },
  {
    mainSection: "Administration",
    subSections: [
      {
        name: "Administration > Users",
        key: "ADMIN_USERS",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: true,
          DELETE: true,
        },
      },
      {
        name: "Administration > Access Management",
        key: "ADMIN_ACCESS_MNG",
        permissionsExists: {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: true,
        },
      },
    ],
  },
  {
    mainSection: "Design",
    subSections: [
      {
        break: true,
        name: "Components",
      },
      {
        name: "Accordion & Divider",
        key: "COMPONENTS_ACCORDION_DIVIDER",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Image Designs",
        key: "COMPONENTS_IMAGE_DESIGNS",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Tab Panel",
        key: "COMPONENTS_TAB_PANEL",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Under Development",
        key: "COMPONENTS_UNDER_DEVELOPMENT",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        break: true,
        name: "Input Fields",
      },
      {
        name: "Autocomplete",
        key: "INPUT_FIELDS_AUTOCOMPLETE",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Text Fields",
        key: "INPUT_FIELDS_TEXT_FIELDS",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Date Pickers",
        key: "INPUT_FIELDS_DATE_PICKERS",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Other Input Fields",
        key: "INPUT_FIELDS_OTHER_INPUTS",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
    ],
  },
  {
    mainSection: "Sample CRUD",
    subSections: [
      {
        break: true,
        name: "Chemical MNG",
      },
      {
        name: "Dashboard",
        key: "CHEMICAL_MNG_DASHBOARD",
        permissionsExists: {
          VIEW: true,
          CREATE: false,
          EDIT: false,
          DELETE: false,
        },
      },
      {
        name: "Request Register",
        key: "CHEMICAL_MNG_REQUEST_REGISTER",
        permissionsExists: {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: true,
        },
      },
      {
        name: "Purchase & Inventory",
        key: "CHEMICAL_MNG_PURCHASE_INVENTORY",
        permissionsExists: {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: true,
        },
      },
      {
        name: "Transaction",
        key: "CHEMICAL_MNG_TRANSACTION",
        permissionsExists: {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: true,
        },
      },
      {
        name: "Assigned Tasks",
        key: "CHEMICAL_MNG_ASSIGNED_TASKS",
        permissionsExists: {
          VIEW: true,
          CREATE: true,
          EDIT: true,
          DELETE: true,
        },
      },
    ],
  },
];

export interface PermissionSection {
  mainSection: string;
  subSections: SubSection[];
}

export interface SubSectionWithPermissions {
  name: string;
  key: string;
  permissionsExists: PermissionsExists;
}

export interface SubSectionBreak {
  break: boolean;
  name: string;
}

export type SubSection = SubSectionWithPermissions | SubSectionBreak;

export interface PermissionsExists {
  VIEW: boolean;
  CREATE: boolean;
  EDIT: boolean;
  DELETE: boolean;
}

export enum PermissionKeys {
  //Insight
  INSIGHT_VIEW = "INSIGHT_VIEW",
  // Administration
  ADMIN_USERS_VIEW = "ADMIN_USERS_VIEW",
  ADMIN_USERS_EDIT = "ADMIN_USERS_EDIT",
  ADMIN_USERS_DELETE = "ADMIN_USERS_DELETE",
  ADMIN_ACCESS_MNG_VIEW = "ADMIN_ACCESS_MNG_VIEW",
  ADMIN_ACCESS_MNG_CREATE = "ADMIN_ACCESS_MNG_CREATE",
  ADMIN_ACCESS_MNG_EDIT = "ADMIN_ACCESS_MNG_EDIT",
  ADMIN_ACCESS_MNG_DELETE = "ADMIN_ACCESS_MNG_DELETE",
  // Design
  COMPONENTS_ACCORDION_DIVIDER_VIEW = "COMPONENTS_ACCORDION_DIVIDER_VIEW",
  COMPONENTS_IMAGE_DESIGNS_VIEW = "COMPONENTS_IMAGE_DESIGNS_VIEW",
  COMPONENTS_TAB_PANEL_VIEW = "COMPONENTS_TAB_PANEL_VIEW",
  COMPONENTS_UNDER_DEVELOPMENT_VIEW = "COMPONENTS_UNDER_DEVELOPMENT_VIEW",
  // Input Fields
  INPUT_FIELDS_AUTOCOMPLETE_VIEW = "INPUT_FIELDS_AUTOCOMPLETE_VIEW",
  INPUT_FIELDS_TEXT_FIELDS_VIEW = "INPUT_FIELDS_TEXT_FIELDS_VIEW",
  INPUT_FIELDS_DATE_PICKERS_VIEW = "INPUT_FIELDS_DATE_PICKERS_VIEW",
  INPUT_FIELDS_OTHER_INPUTS_VIEW = "INPUT_FIELDS_OTHER_INPUTS_VIEW",
  // Chemical MNG
  CHEMICAL_MNG_DASHBOARD_VIEW = "CHEMICAL_MNG_DASHBOARD_VIEW",
  CHEMICAL_MNG_REQUEST_REGISTER_VIEW = "CHEMICAL_MNG_REQUEST_REGISTER_VIEW",
  CHEMICAL_MNG_REQUEST_REGISTER_CREATE = "CHEMICAL_MNG_REQUEST_REGISTER_CREATE",
  CHEMICAL_MNG_REQUEST_REGISTER_EDIT = "CHEMICAL_MNG_REQUEST_REGISTER_EDIT",
  CHEMICAL_MNG_REQUEST_REGISTER_DELETE = "CHEMICAL_MNG_REQUEST_REGISTER_DELETE",
  CHEMICAL_MNG_PURCHASE_INVENTORY_VIEW = "CHEMICAL_MNG_PURCHASE_INVENTORY_VIEW",
  CHEMICAL_MNG_PURCHASE_INVENTORY_CREATE = "CHEMICAL_MNG_PURCHASE_INVENTORY_CREATE",
  CHEMICAL_MNG_PURCHASE_INVENTORY_EDIT = "CHEMICAL_MNG_PURCHASE_INVENTORY_EDIT",
  CHEMICAL_MNG_PURCHASE_INVENTORY_DELETE = "CHEMICAL_MNG_PURCHASE_INVENTORY_DELETE",
  CHEMICAL_MNG_TRANSACTION_VIEW = "CHEMICAL_MNG_TRANSACTION_VIEW",
  CHEMICAL_MNG_TRANSACTION_CREATE = "CHEMICAL_MNG_TRANSACTION_CREATE",
  CHEMICAL_MNG_TRANSACTION_EDIT = "CHEMICAL_MNG_TRANSACTION_EDIT",
  CHEMICAL_MNG_TRANSACTION_DELETE = "CHEMICAL_MNG_TRANSACTION_DELETE",
  CHEMICAL_MNG_ASSIGNED_TASKS_VIEW = "CHEMICAL_MNG_ASSIGNED_TASKS_VIEW",
  CHEMICAL_MNG_ASSIGNED_TASKS_CREATE = "CHEMICAL_MNG_ASSIGNED_TASKS_CREATE",
  CHEMICAL_MNG_ASSIGNED_TASKS_EDIT = "CHEMICAL_MNG_ASSIGNED_TASKS_EDIT",
  CHEMICAL_MNG_ASSIGNED_TASKS_DELETE = "CHEMICAL_MNG_ASSIGNED_TASKS_DELETE",
}

// Create the Zod schema using the enum values
export const PermissionKeysObjectSchema = z.object(
  Object.values(PermissionKeys).reduce((acc, key) => {
    acc[key] = z.boolean();
    return acc;
  }, {} as Record<PermissionKeys, z.ZodBoolean>)
);

// Infer the TypeScript type from the Zod schema
export type PermissionKeysObject = z.infer<typeof PermissionKeysObjectSchema>;

export const defaultAdminPermissions = Object.values(PermissionKeys).reduce(
  (acc, key) => {
    acc[key] = true;
    return acc;
  },
  {} as Record<PermissionKeys, boolean>
);

export const defaultViewerPermissions: PermissionKeysObject = {
  // Insight
  INSIGHT_VIEW: true,
  // Administration
  ADMIN_USERS_VIEW: true,
  ADMIN_USERS_EDIT: true,
  ADMIN_USERS_DELETE: true,
  ADMIN_ACCESS_MNG_VIEW: true,
  ADMIN_ACCESS_MNG_CREATE: true,
  ADMIN_ACCESS_MNG_EDIT: true,
  ADMIN_ACCESS_MNG_DELETE: true,
  // Design
  COMPONENTS_ACCORDION_DIVIDER_VIEW: true,
  COMPONENTS_IMAGE_DESIGNS_VIEW: true,
  COMPONENTS_TAB_PANEL_VIEW: true,
  COMPONENTS_UNDER_DEVELOPMENT_VIEW: true,
  // Input Fields
  INPUT_FIELDS_AUTOCOMPLETE_VIEW: true,
  INPUT_FIELDS_TEXT_FIELDS_VIEW: true,
  INPUT_FIELDS_DATE_PICKERS_VIEW: true,
  INPUT_FIELDS_OTHER_INPUTS_VIEW: true,
  // Chemical MNG
  CHEMICAL_MNG_DASHBOARD_VIEW: true,
  CHEMICAL_MNG_REQUEST_REGISTER_VIEW: true,
  CHEMICAL_MNG_REQUEST_REGISTER_CREATE: true,
  CHEMICAL_MNG_REQUEST_REGISTER_EDIT: true,
  CHEMICAL_MNG_REQUEST_REGISTER_DELETE: true,
  CHEMICAL_MNG_PURCHASE_INVENTORY_VIEW: true,
  CHEMICAL_MNG_PURCHASE_INVENTORY_CREATE: true,
  CHEMICAL_MNG_PURCHASE_INVENTORY_EDIT: true,
  CHEMICAL_MNG_PURCHASE_INVENTORY_DELETE: true,
  CHEMICAL_MNG_TRANSACTION_VIEW: true,
  CHEMICAL_MNG_TRANSACTION_CREATE: true,
  CHEMICAL_MNG_TRANSACTION_EDIT: true,
  CHEMICAL_MNG_TRANSACTION_DELETE: true,
  CHEMICAL_MNG_ASSIGNED_TASKS_VIEW: true,
  CHEMICAL_MNG_ASSIGNED_TASKS_CREATE: true,
  CHEMICAL_MNG_ASSIGNED_TASKS_EDIT: true,
  CHEMICAL_MNG_ASSIGNED_TASKS_DELETE: true,
};
