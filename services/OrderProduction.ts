import { api } from "./api";

export enum OrderStatus {
  PENDING = "PENDING",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
  CANCELLED = "CANCELLED",
}

export function createOrder(order: OrderRequest): Promise<OrderResponse> {
  return api.post("/order-production/create", order).then((response) => {
    return response.data as OrderResponse;
  });
}

export function getOrderById(orderId: string): Promise<OrderResponse> {
  return api.get(`/order-production/get/${orderId}`).then((response) => {
    return response.data as OrderResponse;
  });
}

export function getOrderAll(): Promise<OrderResponse[]> {
  return api.get("/order-production/getAll").then((response) => {
    return response.data as OrderResponse[];
  });
}

export function updateOrderStatus(
  orderId: string,
  orderRequest: OrderRequest,
): Promise<OrderResponse> {
  return api.put(`/order-production/update/${orderId}`, orderRequest).then((response) => {
    return response.data as OrderResponse;
  });
}

export function deleteOrder(orderId: string): Promise<void> {
  return api.delete(`/order-production/delete/${orderId}`).then((response) => {
    return response.data as void;
  });
}

export interface OrderRequest {
  userId: string;
  productionStatus: OrderStatus;
}

export interface OrderResponse {
  id?: string;
  orderId?: string;
  userId: string;
  userName?: string;
  productionStatus: OrderStatus;
  createdAt: string;
  updatedAt: string;
}
