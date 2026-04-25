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

export function getProdutosByDescription(description: string): Promise<Produto[]> {
  return api.get(`/stock/getItemByDescription/${description}`).then((response) => {
    return response.data as Produto[];
  });
}

export interface Lote {
  id: number;
  identificacao: string;
  produtoId: number;
  identificacaoProduto: string;
  descricao: string;
  dataCriacao: string;
  quantidade: number;
  saldo: number;
  dataValidade: string;
  localizacao: string;
  depositoDescricao: string;
  produtoNome?: string;
}

export function getLotesByProdutoId(produtoId: number): Promise<Lote[]> {
  return api.get(`/stock/getLotesByProductId/${produtoId}`).then((response) => {
    return response.data as Lote[];
  });
}

export function getLotesByLocalizacao(localizacao: string): Promise<Lote[]> {
  return api.get(`/stock/getLotByLocation/${localizacao}`).then((response) => {
    return response.data as Lote[];
  });
}