import { api } from "./api";

export interface Produto {
   id: number;
  identificacao: string;
  descricao: string;
  unidadeMedida: string;
  tipo: string;
  origem: string;
  valorVenda: number;
  valorCusto: number;
  ncm: string;
  status: string;
  localizacao: string;
}

export function getProdutos(description: string): Promise<Produto[]> {
  return api.get(`/stock/getItemByDescription/${description}`).then((response) => {
    return response.data as Produto[];
  });
}