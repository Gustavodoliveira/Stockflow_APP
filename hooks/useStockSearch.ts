import {
    getLotesByProdutoId,
    getProdutosByDescription,
    Lote,
    Produto,
} from "@/services/StockApi";
import { useState } from "react";

export function useStockSearch() {
  const [produtoSearch, setProdutoSearch] = useState("");
  const [loteSearch, setLoteSearch] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [selectedLote, setSelectedLote] = useState<Lote | null>(null);
  const [loadingProdutos, setLoadingProdutos] = useState(false);
  const [loadingLotes, setLoadingLotes] = useState(false);

  const filteredLotes = lotes.filter((item) =>
    item.identificacao.toLowerCase().includes(loteSearch.toLowerCase()),
  );

  const canAdd = selectedProduto !== null && selectedLote !== null;

  async function handleSearchProduto(text: string) {
    setProdutoSearch(text);
    setSelectedProduto(null);
    setSelectedLote(null);
    setLoteSearch("");
    setLotes([]);

    if (text.trim().length < 2) {
      setProdutos([]);
      return;
    }

    setLoadingProdutos(true);
    try {
      setProdutos(await getProdutosByDescription(text.trim()));
    } catch {
      setProdutos([]);
    } finally {
      setLoadingProdutos(false);
    }
  }

  async function handleSelectProduto(produto: Produto) {
    setSelectedProduto(produto);
    setSelectedLote(null);
    setProdutoSearch(produto.descricao);
    setLoteSearch("");
    setLoadingLotes(true);

    try {
      setLotes(await getLotesByProdutoId(produto.id));
    } catch {
      setLotes([]);
    } finally {
      setLoadingLotes(false);
    }
  }

  function handleSelectLote(lote: Lote) {
    setSelectedLote(lote);
    setLoteSearch(lote.identificacao);
  }

  function reset() {
    setProdutoSearch("");
    setLoteSearch("");
    setProdutos([]);
    setLotes([]);
    setSelectedProduto(null);
    setSelectedLote(null);
    setLoadingProdutos(false);
    setLoadingLotes(false);
  }

  return {
    produtoSearch,
    loteSearch,
    setLoteSearch,
    produtos,
    filteredLotes,
    selectedProduto,
    selectedLote,
    loadingProdutos,
    loadingLotes,
    canAdd,
    handleSearchProduto,
    handleSelectProduto,
    handleSelectLote,
    reset,
  };
}
