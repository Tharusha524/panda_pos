import React, { Suspense, useMemo } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router";
import AppShellLayout from "./components/Layout/AppShellLayout";
import PageLoader from "./components/PageLoader";
import useCurrentUser from "./hooks/useCurrentUser";
import SubscriptionGuard from "./components/SubscriptionGuard";
import { PermissionKeys } from "./views/Administration/SectionList";
import { guardedElement, guardedPage } from "./routing/routeGuards";
import { useQuery } from "@tanstack/react-query";
import { User, getCurrentUser, isAuthenticated } from "./api/userApi";
import { LOGIN_PATH } from "./config/appPaths";
import BackendConfigGate from "./components/BackendConfigGate";
import {
  loadPosCustomers,
  loadPosDashboard,
  loadPosExpenses,
  loadPosInventory,
  loadPosItems,
  loadPosOffers,
  loadPosPayments,
  loadPosPurchasing,
  loadPosRepair,
  loadPosReports,
  loadPosSales,
  loadPosSettings,
  loadPosShipping,
  loadPosSuppliers,
} from "./routing/posRouteChunks";

//Login Page
const LoginPage = React.lazy(() => import("./views/LoginPage/LoginPage"));

// Backend configure (one-time API setup)
const BackendConfigurePage = React.lazy(
  () => import("./views/BackendConfigurePage/BackendConfigurePage")
);

//Register Page
const RegistrationPage = React.lazy(
  () => import("./views/RegistrationPage/RegistrationPage")
);

//POS System (shared loaders enable prefetch + single POS bundle)
const POSDashboard = React.lazy(loadPosDashboard);
const POSSales = React.lazy(loadPosSales);
const POSPayments = React.lazy(loadPosPayments);
const POSExpenses = React.lazy(loadPosExpenses);
const POSCustomers = React.lazy(loadPosCustomers);
const POSItems = React.lazy(loadPosItems);
const POSInventory = React.lazy(loadPosInventory);
const POSPurchasing = React.lazy(loadPosPurchasing);
const POSSuppliers = React.lazy(loadPosSuppliers);
const POSShipping = React.lazy(loadPosShipping);
const POSOffers = React.lazy(loadPosOffers);
const POSRepair = React.lazy(loadPosRepair);
const POSReports = React.lazy(loadPosReports);
const POSSettings = React.lazy(loadPosSettings);

//Administration
const UserTable = React.lazy(() => import("./views/Administration/UserTable"));
const AccessManagementTable = React.lazy(
  () => import("./views/Administration/AccessManagementTable")
);

//Design - Components
const AccordionAndDividers = React.lazy(
  () => import("./views/Components/AccordionAndDividers")
);
const ImageDesigns = React.lazy(
  () => import("./views/Components/ImageDesigns")
);
const TabPanel = React.lazy(() => import("./views/Components/TabPanel"));
const UnderDevelopment = React.lazy(
  () => import("./components/UnderDevelopment")
);

//Design - Input Fields
const TextField = React.lazy(() => import("./views/Components/TextField"));
const DatePickers = React.lazy(() => import("./views/Components/DatePickers"));
const OtherInputs = React.lazy(() => import("./views/Components/OtherInputs"));

//Sample CRUD - Chemical management
const ChemicalRequestTable = React.lazy(
  () => import("./views/ChemicalMng/ChemicalRequestTable")
);
const ChemicalPurchaseInventoryTable = React.lazy(
  () => import("./views/ChemicalMng/ChemicalPurchaseInventoryTable")
);
const ChemicalTransactionTable = React.lazy(
  () => import("./views/ChemicalMng/TransactionTable")
);
const ChemicalDashboard = React.lazy(
  () => import("./views/ChemicalMng/Dashboard")
);

const Autocomplete = React.lazy(
  () => import("./views/Components/Autocomplete")
);

function withoutLayout(Component: React.LazyExoticComponent<any>) {
  return (
    <Suspense
      fallback={
        <>
          <PageLoader />
        </>
      }
    >
      <Component />
    </Suspense>
  );
}

const ProtectedRoute = () => {
  const { user, status } = useCurrentUser();

  if (status === "loading" || status === "idle" || status === "pending") {
    return <PageLoader />;
  }

  if (!user || !isAuthenticated()) {
    return <Navigate to={LOGIN_PATH} replace />;
  }

  return <Outlet />;
};

const AppRoutes = () => {
  const { data: user, status } = useQuery<User>({
    queryKey: ["current-user"],
    queryFn: getCurrentUser,
  });

  const userPermissionObject = useMemo(() => {
    if (user && user?.permissionObject) {
      return user?.permissionObject;
    }
  }, [user]);
  return (
    <Routes>
      <Route element={<BackendConfigGate />}>
        <Route path="/configure" element={withoutLayout(BackendConfigurePage)} />
        <Route path="/" element={withoutLayout(LoginPage)} />
        <Route path="/register" element={withoutLayout(RegistrationPage)} />
        <Route path="/home" element={<Navigate to="/dashboard" replace />} />
        <Route element={<ProtectedRoute />}>
        <Route element={<SubscriptionGuard />}>
        <Route element={<AppShellLayout />}>

        {/* POS System */}
        <Route path="/dashboard" element={<POSDashboard />} />
        <Route path="/sales/*" element={<POSSales />} />
        <Route path="/payments/*" element={<POSPayments />} />
        <Route path="/expenses/*" element={<POSExpenses />} />
        <Route path="/customers/*" element={<POSCustomers />} />
        <Route path="/items/*" element={<POSItems />} />
        <Route path="/inventory/*" element={<POSInventory />} />
        <Route path="/purchasing/*" element={<POSPurchasing />} />
        <Route path="/suppliers/*" element={<POSSuppliers />} />
        <Route path="/shipping/*" element={<POSShipping />} />
        <Route path="/offers/*" element={<POSOffers />} />
        <Route path="/repair/*" element={<POSRepair />} />
        <Route path="/reports/*" element={<POSReports />} />
        <Route path="/settings/*" element={<POSSettings />} />

        {/* Admin Controller */}
        <Route
          path="/admin/users"
          element={guardedPage(userPermissionObject?.[PermissionKeys.INSIGHT_VIEW], UserTable)}
        />
        <Route
          path="/admin/access-management"
          element={guardedPage(userPermissionObject?.[PermissionKeys.ADMIN_USERS_VIEW], AccessManagementTable)}
        />

        {/* Design - Components */}
        <Route
          path="/components/accordion-divider"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.COMPONENTS_ACCORDION_DIVIDER_VIEW],
            AccordionAndDividers
          )}
        />
        <Route
          path="/components/image-designs"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.COMPONENTS_IMAGE_DESIGNS_VIEW],
            ImageDesigns
          )}
        />
        <Route
          path="/components/tab-panels"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.COMPONENTS_TAB_PANEL_VIEW],
            TabPanel
          )}
        />
        <Route
          path="/components/under-development"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.COMPONENTS_UNDER_DEVELOPMENT_VIEW],
            UnderDevelopment
          )}
        />

        {/* Design - Input Fields */}
        <Route
          path="/input-fields/autocomplete"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.INPUT_FIELDS_AUTOCOMPLETE_VIEW],
            Autocomplete
          )}
        />
        <Route
          path="/input-fields/textfield"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.INPUT_FIELDS_TEXT_FIELDS_VIEW],
            TextField
          )}
        />
        <Route
          path="/input-fields/date-pickers"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.INPUT_FIELDS_DATE_PICKERS_VIEW],
            DatePickers
          )}
        />
        <Route
          path="/input-fields/other-inputs"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.INPUT_FIELDS_OTHER_INPUTS_VIEW],
            OtherInputs
          )}
        />

        {/* chemical management */}
        <Route
          path="/chemical-mng/dashboard"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.CHEMICAL_MNG_DASHBOARD_VIEW],
            ChemicalDashboard
          )}
        />
        <Route
          path="/chemical-mng/chemical-requests"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.CHEMICAL_MNG_REQUEST_REGISTER_VIEW],
            ChemicalRequestTable
          )}
        />
        <Route
          path="/chemical-mng/purchase-inventory"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.CHEMICAL_MNG_PURCHASE_INVENTORY_VIEW],
            ChemicalPurchaseInventoryTable
          )}
        />
        <Route
          path="/chemical-mng/transaction"
          element={guardedPage(
            userPermissionObject?.[PermissionKeys.CHEMICAL_MNG_TRANSACTION_VIEW],
            ChemicalTransactionTable
          )}
        />
        <Route
          path="/chemical-mng/assigned-tasks"
          element={guardedElement(
            userPermissionObject?.[PermissionKeys.CHEMICAL_MNG_ASSIGNED_TASKS_VIEW],
            <ChemicalRequestTable isAssignedTasks={true} />
          )}
        />
        </Route>
      </Route>
      </Route>
      </Route>
    </Routes>
  );
};

export default AppRoutes;
