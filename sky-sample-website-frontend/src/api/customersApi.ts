import axios from "axios";

export interface CustomerType {
  id: number;
  name: string;
}

export interface Customer {
  id: number;
  customer_id: string;
  customer_code: string;
  customer_name: string;
  first_name: string;
  business_name: string | null;
  contact_no: string;
  allow_duplicate_phone?: boolean;
  email: string | null;
  date_of_birth?: string | null;
  passport_no?: string | null;
  nic?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  province?: string | null;
  source?: string | null;
  sales_person_id?: string | null;
  lead_sales_person?: string | null;
  other_sales_person?: string | null;
  support_person?: string | null;
  customer_status?: string | null;
  product?: string | null;
  credit_limit: number;
  opening_balance?: number;
  net_balance: number;
  notes?: string | null;
  language?: string | null;
  inventory_location?: string | null;
  location: string | null;
  route: string | null;
  customer_type_id?: number | null;
  customer_discount?: number;
  advance_payments_total?: number;
}

export interface CustomersListResponse {
  customers: Customer[];
  summary: {
    total_customers: number;
    debtor_count: number;
    total_receivables: number;
  };
  locations: string[];
}

export type CustomerPayload = {
  customer_code?: string;
  first_name: string;
  customer_name?: string;
  business_name?: string | null;
  contact_no: string;
  allow_duplicate_phone?: boolean;
  email?: string | null;
  date_of_birth?: string | null;
  passport_no?: string | null;
  nic?: string | null;
  address_line1?: string | null;
  city?: string | null;
  postal_code?: string | null;
  country?: string | null;
  province?: string | null;
  source?: string | null;
  sales_person_id?: string | null;
  lead_sales_person?: string | null;
  other_sales_person?: string | null;
  support_person?: string | null;
  customer_status?: string | null;
  product?: string | null;
  credit_limit?: number;
  opening_balance?: number;
  net_balance?: number;
  notes?: string | null;
  language?: string | null;
  inventory_location?: string | null;
  location?: string | null;
  route: string;
  customer_type_id?: number | null;
  customer_discount?: number;
  advance_payment?: number;
  advance_payment_notes?: string | null;
  apply_advance_on_update?: boolean;
  payment_received?: number;
  payment_received_notes?: string | null;
};

export type CustomerOrderBy =
  | "customer_id"
  | "customer_name"
  | "contact_no"
  | "credit_limit"
  | "net_balance";

export type CustomerSort = "asc" | "desc";

export async function getCustomers(
  location?: string,
  orderBy?: CustomerOrderBy,
  sort?: CustomerSort
): Promise<CustomersListResponse> {
  const res = await axios.get("/api/customers", {
    params: {
      ...(location && location !== "all" ? { location } : {}),
      ...(orderBy ? { order_by: orderBy } : {}),
      ...(sort ? { sort } : {}),
    },
  });
  return {
    customers: res.data.data,
    summary: res.data.summary ?? { total_customers: 0, debtor_count: 0, total_receivables: 0 },
    locations: res.data.filters?.locations ?? ["Main Location"],
  };
}

export async function getCustomer(id: number): Promise<Customer> {
  const res = await axios.get(`/api/customers/${id}`);
  return res.data.data;
}

export async function getCustomerTypes(): Promise<CustomerType[]> {
  const res = await axios.get("/api/customers/types");
  return res.data.data;
}

export async function createCustomerType(name: string): Promise<CustomerType> {
  const res = await axios.post("/api/customers/types", { name });
  return res.data.data;
}

export async function createCustomer(payload: CustomerPayload): Promise<Customer> {
  const res = await axios.post("/api/customers", payload);
  return res.data.data;
}

export async function updateCustomer(
  id: number,
  payload: Partial<CustomerPayload>
): Promise<Customer> {
  const res = await axios.put(`/api/customers/${id}`, payload);
  return res.data.data;
}

export async function deleteCustomer(id: number): Promise<void> {
  await axios.delete(`/api/customers/${id}`);
}

export type ReceiveCustomerPaymentPayload = {
  amount: number;
  payment_method?: string;
  notes?: string;
  location?: string;
};

export type ReceiveCustomerPaymentResult = {
  customer: Customer;
  payment_received: number;
  previous_balance: number;
  new_balance: number;
  payment_method: string;
};

export async function receiveCustomerPayment(
  id: number,
  payload: ReceiveCustomerPaymentPayload
): Promise<ReceiveCustomerPaymentResult> {
  const res = await axios.post(`/api/customers/${id}/receive-payment`, payload);
  return res.data.data;
}
