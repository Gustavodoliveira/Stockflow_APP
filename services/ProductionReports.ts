import { api } from "./api";
import { getToken } from "./auth";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import { Platform } from "react-native";

export type ProductionItem = {
  id: string;
  orderId: string;
  itemType: "Input" | "Output";
  externalProductId: string;
  productName: string;
  unit: string;
  quantity: number;
  unitWeight: number;
  lot: string;
  externalLotId?: number | null;
  dateFabrication: string;
  dateValidity: string;
};
export type ProductionItemPayload = Omit<ProductionItem, "id" | "orderId">;
export type ProductionDetails = {
  orderNumber?: number;
  requisitionNumber: string;
  description: string;
  startedOn: string | null;
  completedOn: string | null;
  responsible: string;
};
export type QualityCheck = {
  itemId: string;
  aspectApproved: boolean | null;
  colorApproved: boolean | null;
  odorApproved: boolean | null;
  samplesCollected: boolean | null;
  labelsVerified: boolean | null;
  responsible: string;
  correctiveAction: string;
};
export type QualityPayload = Omit<QualityCheck, "itemId">;

export async function createProductionWithItems(userId: string,
  productionStatus: string, items: ProductionItemPayload[]) {
  const { data } = await api.post<{id: string}>("/order-production/create-with-items",
    {userId, productionStatus, items});
  return data;
}
export async function getProductionItems(orderId: string): Promise<ProductionItem[]> {
  const { data } = await api.get<ProductionItem[]>(`/order-production-items/order/${orderId}`);
  return data;
}
export async function createProductionItems(items: (ProductionItemPayload & {orderId:string})[]) {
  return api.post("/order-production-items",items);
}
export async function updateProductionItem(item: ProductionItem) {
  const {id,...payload} = item;
  return api.put(`/order-production-items/${id}`,payload);
}
export async function removeProductionItem(id: string) {
  return api.delete(`/order-production-items/${id}`);
}
export async function getProductionDetails(id: string): Promise<ProductionDetails> {
  const {data} = await api.get<ProductionDetails>(`/order-production/${id}/report-details`);
  return data;
}
export async function saveProductionDetails(id:string, details:ProductionDetails) {
  return api.put(`/order-production/${id}/report-details`, details);
}
export async function getQualityChecks(id:string): Promise<QualityCheck[]> {
  const {data} = await api.get<QualityCheck[]>(`/order-production/${id}/quality-checks`);
  return data;
}
export async function saveQualityCheck(orderId:string, itemId:string, values:QualityPayload) {
  return api.put(`/order-production/${orderId}/quality-checks/${itemId}`,values);
}
export async function downloadProductionPdf(orderId:string, kind:"production"|"quality") {
  const name = kind === "production" ? "ordem-producao" : "fracionamento";
  const suffix = kind === "production" ? "pdf" : "quality-pdf";
  const url = `${api.defaults.baseURL?.replace(/\/$/,"")}/order-production/${orderId}/${suffix}`;
  const token = await getToken();
  if (!token) throw new Error("Sessão expirada. Entre novamente.");
  if (Platform.OS === "web") {
    // Browser downloads use a blob to send the same Bearer token without exposing it in the URL.
    const response = await api.get(`/order-production/${orderId}/${suffix}`,{responseType:"blob"});
    const objectUrl = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = `${name}-${orderId}.pdf`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(objectUrl);
    return;
  }
  const target = `${FileSystem.cacheDirectory}${name}-${orderId}.pdf`;
  const downloaded = await FileSystem.downloadAsync(url,target,{
    headers:{Authorization:`Bearer ${token}`}
  });
  if (downloaded.status !== 200) throw new Error("Não foi possível baixar o PDF.");
  if (!(await Sharing.isAvailableAsync())) throw new Error("Compartilhamento indisponível neste dispositivo.");
  await Sharing.shareAsync(downloaded.uri,{mimeType:"application/pdf",dialogTitle:"Salvar ou compartilhar PDF",UTI:"com.adobe.pdf"});
}
