import { api } from "./api";



export interface SincOrder {
  id: string; // UUID
  externalId: number;
  numeroPedido: string;
  cliente: number;
  status: string;
  xped?: string;
  especieVolumes?: string;
  qtdeVolumes?: string;
  dataPrevisao?: string;
  dataCriacao?: string;
  dataUltimaAtualizacao?: string;
  valorFrete?: string; // BigDecimal como string
  valorTotal: string; // BigDecimal como string
  createdAt: string; // Instant como string ISO
  updatedAt?: string; // Instant como string ISO
  userId?: string; // UUID
  statusInterno?: string;
  localizacao?: string;
  nomeCliente?: string;
  itens: ExternalOrderItem[];
}

export interface ExternalOrderItem {
  id: string; // UUID
  externalOrder?: any; // Referência ao pedido externo, pode ser omitido ou tipado melhor se necessário
  externalItemId: number;
  produto: number;
  qtde: number;
  valorUnitario: string; // BigDecimal como string
  dadosAdicionais?: string;
  obsItem?: string;
  pesoBruto?: number;
  pesoLiquido?: number;
  unidade?: string;
  lote?: string;
  dataValidade?: string;
  localizacao?: string;
  nomeProduto?: string;
  tipoProduto?: string;
}



export function sincOrder(): Promise<SincOrder[]> {
  return api.post("/orders/sync", ).then((res) => res.data as SincOrder[]);
}

export function setUserInOrder(orderId: string, userId: string): Promise<void> {
  console.log(`Associando usuário ${userId} ao pedido ${orderId}`);
  return api.patch(`/orders/${orderId}/separador`, { userId }).then(() => {});
}

export function getRawOrder(orderId: string): Promise<SincOrder> {
  return api.get(`/orders/${orderId}`).then((res) => res.data as SincOrder);
}

export function finalizarPedido(orderId: string): Promise<void> {
  return api.patch(`/orders/${orderId}/finalizar`).then(() => {});
}

export function atualizarStatusInterno(
  orderId: string,
  statusInterno: string,
): Promise<void> {
  return api
    .patch(`/orders/${orderId}/status-interno`, { statusInterno })
    .then(() => {});
}