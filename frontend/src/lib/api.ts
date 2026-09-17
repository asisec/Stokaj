import { getToken, removeToken } from "./auth"

export const API_URL = process.env.NEXT_PUBLIC_API_URL || ""


async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  }
  if (token) {
    headers["Authorization"] = `Bearer ${token}`
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  })

  if (res.status === 401) {
    removeToken()
    if (typeof window !== "undefined") {
      window.location.href = "/login"
    }
    throw new Error("Oturum süresi doldu, lütfen tekrar giriş yapın")
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Bir hata oluştu" }))
    throw new Error(err.error || "Bir hata oluştu")
  }
  return res.json()
}

export interface Motorcycle {
  id: number
  chassis_number: string
  brand: string
  model: string
  year: number
  color: string
  status: string
  is_other_branch: boolean
  branch_name: string
  created_at: string
  updated_at: string
}

export interface SparePart {
  id: number
  category: string
  name: string
  compatible_brand: string
  compatible_model: string
  quantity: number
  description: string
  is_defective: boolean
  created_at: string
  updated_at: string
}

export interface Customer {
  id: number
  first_name: string
  last_name: string
  identity_number: string
  phone: string
  email: string
  address: string
  sales?: Sale[]
  created_at: string
  updated_at: string
}

export interface CustomerTransaction {
  id: number;
  customer_id: number;
  type: string;
  description: string;
  reference_type: string;
  reference_id: number;
  created_at: string;
}

export interface SaleItem {
  id: number
  sale_id: number
  item_type: string
  item_id: number
  item_name: string
  quantity: number
}

export interface SalePayment {
  id: number
  sale_id: number
  method: string
}

export interface Sale {
  id: number
  customer_id: number
  customer: Customer
  payments: SalePayment[]
  items: SaleItem[]
  created_at: string
}

export type DocumentStatus = "notary_pending" | "plate_pending" | "ready_for_delivery" | "delivered";

export interface RegistrationDocument {
  id: number;
  sale_id: number | null;
  motorcycle_id: number;
  customer_id: number;
  motorcycle?: Motorcycle;
  customer?: Customer;
  plate_number: string;
  registration_serial: string;
  notary_name: string;
  notary_doc_no: string;
  notary_date: string | null;
  has_insurance: boolean;
  status: DocumentStatus;
  delivered_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
}

export interface SalesTrend {
  date: string
  sales_count: number
}

export interface BrandStat {
  brand: string
  count: number
}

export interface DashboardStats {
  total_motorcycles: number;
  available_motorcycles: number;
  sold_motorcycles: number;
  total_spare_parts: number;
  total_spare_parts_quantity: number;
  low_stock_count: number;
  total_customers: number;
  total_sales: number;
  recent_sales: Sale[];
  sales_trend: SalesTrend[];
  top_brands: BrandStat[];
}

export const api = {
  getMotorcycles: (search?: string, status?: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    const query = params.toString()
    return request<Motorcycle[]>(`/api/motorcycles${query ? `?${query}` : ""}`)
  },
  getMotorcycle: (id: number) => request<Motorcycle>(`/api/motorcycles/${id}`),
  createMotorcycle: (data: Partial<Motorcycle>) => request<Motorcycle>("/api/motorcycles", { method: "POST", body: JSON.stringify(data) }),
  updateMotorcycle: (id: number, data: Partial<Motorcycle>) => request<Motorcycle>(`/api/motorcycles/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteMotorcycle: (id: number) => request<void>(`/api/motorcycles/${id}`, { method: "DELETE" }),
  getPublicMotorcycleByChassis: async (chassis: string) => {
    const list = await request<Motorcycle[]>(`/api/motorcycles?search=${encodeURIComponent(chassis)}`);
    const found = list.find((m) => m.chassis_number.toLowerCase() === chassis.toLowerCase());
    if (!found) throw new Error("Motosiklet bulunamadı");
    return found;
  },

  getSpareParts: (search?: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const query = params.toString()
    return request<SparePart[]>(`/api/spare-parts${query ? `?${query}` : ""}`)
  },
  getSparePart: (id: number) => request<SparePart>(`/api/spare-parts/${id}`),
  createSparePart: (data: Partial<SparePart>) => request<SparePart>("/api/spare-parts", { method: "POST", body: JSON.stringify(data) }),
  bulkCreateSpareParts: (data: Partial<SparePart>[]) => request<{ message: string; count: number }>("/api/spare-parts/bulk", { method: "POST", body: JSON.stringify(data) }),
  updateSparePart: (id: number, data: Partial<SparePart>) => request<SparePart>(`/api/spare-parts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteSparePart: (id: number) => request<void>(`/api/spare-parts/${id}`, { method: "DELETE" }),

  getCustomers: (search?: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    const query = params.toString()
    return request<Customer[]>(`/api/customers${query ? `?${query}` : ""}`)
  },
  getCustomer: (id: number) => request<Customer>(`/api/customers/${id}`),
  createCustomer: (customer: Omit<Customer, "id" | "created_at" | "updated_at" | "sales">) =>
    request<Customer>("/api/customers", {
      method: "POST",
      body: JSON.stringify(customer),
    }),
  updateCustomer: (id: number, customer: Omit<Customer, "id" | "created_at" | "updated_at" | "sales">) =>
    request<Customer>(`/api/customers/${id}`, {
      method: "PUT",
      body: JSON.stringify(customer),
    }),
  deleteCustomer: (id: number) =>
    request<{ message: string }>(`/api/customers/${id}`, { method: "DELETE" }),
  getCustomerTransactions: (id: number) =>
    request<CustomerTransaction[]>(`/api/customers/${id}/transactions`),

  getSales: () => request<Sale[]>("/api/sales"),
  getSale: (id: number) => request<Sale>(`/api/sales/${id}`),
  createSale: (data: { customer_id: number; items: { item_type: string; item_id: number; quantity: number; }[] }) => request<Sale>("/api/sales", { method: "POST", body: JSON.stringify(data) }),
  deleteSale: (id: number) => request<void>(`/api/sales/${id}`, { method: "DELETE" }),

  getDashboardStats: () => request<DashboardStats>("/api/dashboard/stats"),

  getDocuments: (search?: string, status?: string) => {
    const params = new URLSearchParams()
    if (search) params.set("search", search)
    if (status) params.set("status", status)
    const query = params.toString()
    return request<RegistrationDocument[]>(`/api/documents${query ? `?${query}` : ""}`)
  },
  getDocument: (id: number) => request<RegistrationDocument>(`/api/documents/${id}`),
  createDocument: (data: Partial<RegistrationDocument>) =>
    request<RegistrationDocument>("/api/documents", { method: "POST", body: JSON.stringify(data) }),
  updateDocument: (id: number, data: Partial<RegistrationDocument>) =>
    request<RegistrationDocument>(`/api/documents/${id}`, { method: "PUT", body: JSON.stringify(data) }),
  deleteDocument: (id: number) => request<{ message: string }>(`/api/documents/${id}`, { method: "DELETE" }),
}

