import Button from "@/components/button";
import Input from "@/components/input";
import { useStockSearch } from "@/hooks/useStockSearch";
import { Lote, Produto } from "@/services/StockApi";
import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

function formatDate(iso: string): string {
  if (!iso) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

function applyDateMask(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 2) return digits;
  if (digits.length <= 4) return `${digits.slice(0, 2)}/${digits.slice(2)}`;
  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
}

type Props = {
  visible: boolean;
  title: string;
  manualDates?: boolean;
  autoLote?: string;
  onClose: () => void;
  onConfirm: (
    produto: Produto,
    lote: Lote,
    dataFabricacao: string,
    dataValidade: string,
  ) => void;
};

export default function ProdutoLoteModal({
  visible,
  title,
  manualDates = false,
  autoLote = "",
  onClose,
  onConfirm,
}: Props) {
  const {
    produtoSearch,
    loteSearch,
    setLoteSearch,
    produtos,
    filteredLotes,
    selectedProduto,
    selectedLote,
    loadingProdutos,
    loadingLotes,
    canAdd: canAddBase,
    handleSearchProduto,
    handleSelectProduto,
    handleSelectLote,
    reset,
  } = useStockSearch();

  const [dataFabricacao, setDataFabricacao] = useState("");
  const [dataValidade, setDataValidade] = useState("");

  const canAdd = autoLote
    ? selectedProduto !== null && dataValidade.trim() !== ""
    : manualDates
      ? canAddBase && dataFabricacao.trim() !== "" && dataValidade.trim() !== ""
      : canAddBase;

  function handleClose() {
    reset();
    setDataFabricacao("");
    setDataValidade("");
    onClose();
  }

  function handleConfirm() {
    if (!selectedProduto) return;
    if (!autoLote && !selectedLote) return;
    const fab = autoLote
      ? new Date().toISOString()
      : manualDates
        ? dataFabricacao
        : selectedLote?.dataCriacao || "";
    const val = manualDates ? dataValidade : selectedLote?.dataValidade || "";
    const loteToPass: Lote = autoLote
      ? {
          id: 0,
          identificacao: autoLote,
          produtoId: selectedProduto.id,
          identificacaoProduto: selectedProduto.identificacao,
          descricao: selectedProduto.descricao,
          dataCriacao: fab,
          quantidade: 0,
          saldo: 0,
          dataValidade: val,
          localizacao: "",
          depositoDescricao: "",
        }
      : selectedLote!;
    onConfirm(selectedProduto, loteToPass, fab, val);
    setDataFabricacao("");
    setDataValidade("");
    reset();
  }

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable style={styles.card} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close-outline" size={24} color="#a8d8ff" />
            </TouchableOpacity>
          </View>

          <View style={styles.fields}>
            <Text style={styles.label}>Produto</Text>
            <Input
              placeholder="Pesquisar produto"
              value={produtoSearch}
              onChangeText={handleSearchProduto}
              icon={
                <Ionicons name="search-outline" size={18} color="#7ec8ff" />
              }
            />

            {loadingProdutos ? (
              <ActivityIndicator color="#7ec8ff" style={styles.loader} />
            ) : (
              <ScrollView
                style={styles.list}
                contentContainerStyle={styles.listContent}
                nestedScrollEnabled
              >
                {produtos.length === 0 ? (
                  <Text style={styles.emptyText}>
                    {produtoSearch.trim().length < 2
                      ? "Digite ao menos 2 letras para buscar produtos."
                      : "Nenhum produto encontrado."}
                  </Text>
                ) : (
                  produtos.map((item) => {
                    const selected = item.id === selectedProduto?.id;
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[
                          styles.option,
                          selected && styles.optionSelected,
                        ]}
                        onPress={() => handleSelectProduto(item)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            selected && styles.optionTextSelected,
                          ]}
                        >
                          {item.descricao}
                        </Text>
                        <Text style={styles.optionSub}>
                          {item.identificacao} · {item.unidadeMedida}
                        </Text>
                      </TouchableOpacity>
                    );
                  })
                )}
              </ScrollView>
            )}

            {autoLote ? (
              <View>
                <Text style={styles.label}>Lote (automático)</Text>
                <Text style={styles.dateValue}>{autoLote}</Text>
              </View>
            ) : (
              <>
                <Text style={styles.label}>Lote</Text>
                <Input
                  placeholder="Pesquisar lote"
                  value={loteSearch}
                  onChangeText={(v) => {
                    setLoteSearch(v);
                  }}
                  editable={selectedProduto !== null}
                  icon={
                    <Ionicons
                      name="pricetag-outline"
                      size={18}
                      color="#7ec8ff"
                    />
                  }
                />

                {loadingLotes ? (
                  <ActivityIndicator color="#7ec8ff" style={styles.loader} />
                ) : selectedProduto === null ? (
                  <Text style={styles.emptyText}>
                    Selecione um produto para carregar os lotes.
                  </Text>
                ) : (
                  <ScrollView
                    style={styles.list}
                    contentContainerStyle={styles.listContent}
                    nestedScrollEnabled
                  >
                    {filteredLotes.length === 0 ? (
                      <Text style={styles.emptyText}>
                        Nenhum lote encontrado para este produto.
                      </Text>
                    ) : (
                      filteredLotes.map((item) => {
                        const selected = item.id === selectedLote?.id;
                        return (
                          <TouchableOpacity
                            key={item.id}
                            style={[
                              styles.option,
                              selected && styles.optionSelected,
                            ]}
                            onPress={() => handleSelectLote(item)}
                          >
                            <Text
                              style={[
                                styles.optionText,
                                selected && styles.optionTextSelected,
                              ]}
                            >
                              {item.identificacao}
                            </Text>
                            <Text style={styles.optionSub}>
                              Loc: {item.localizacao || "-"} · Saldo:{" "}
                              {item.saldo}
                            </Text>
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </ScrollView>
                )}
              </>
            )}

            {!manualDates && selectedLote && (
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.label}>Dt. Fabricação</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(selectedLote.dataCriacao)}
                  </Text>
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.label}>Dt. Validade</Text>
                  <Text style={styles.dateValue}>
                    {formatDate(selectedLote.dataValidade)}
                  </Text>
                </View>
              </View>
            )}

            {manualDates && (
              <View style={styles.datesRow}>
                <View style={styles.dateItem}>
                  <Text style={styles.label}>Dt. Fabricação</Text>
                  {autoLote ? (
                    <Text style={styles.dateValue}>
                      {new Date().toLocaleDateString("pt-BR")}
                    </Text>
                  ) : (
                    <Input
                      placeholder="dd/mm/aaaa"
                      value={dataFabricacao}
                      onChangeText={setDataFabricacao}
                      icon={
                        <Ionicons
                          name="calendar-outline"
                          size={18}
                          color="#7ec8ff"
                        />
                      }
                    />
                  )}
                </View>
                <View style={styles.dateItem}>
                  <Text style={styles.label}>Dt. Validade</Text>
                  <Input
                    placeholder="dd/mm/aaaa"
                    value={dataValidade}
                    onChangeText={(v) => setDataValidade(applyDateMask(v))}
                    keyboardType="numeric"
                    icon={
                      <Ionicons
                        name="calendar-outline"
                        size={18}
                        color="#7ec8ff"
                      />
                    }
                  />
                </View>
              </View>
            )}

            <Text style={styles.hint}>
              Selecione um produto e um lote do estoque para adicionar.
            </Text>
          </View>

          <View style={styles.actions}>
            <Button
              title="Fechar"
              variant="outline"
              style={styles.btn}
              onPress={handleClose}
            />
            <Button
              title="Adicionar"
              style={styles.btn}
              onPress={handleConfirm}
              disabled={!canAdd}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: "rgba(13,13,59,0.98)",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(126,200,255,0.25)",
    padding: 20,
    gap: 18,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#a8d8ff",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 1,
  },
  fields: { gap: 10 },
  label: {
    color: "#7ec8ff",
    fontSize: 13,
    fontWeight: "600",
    marginTop: 4,
  },
  list: { maxHeight: 160, marginTop: 4 },
  listContent: { gap: 8 },
  option: {
    backgroundColor: "rgba(126,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(126,200,255,0.15)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  optionSelected: {
    backgroundColor: "rgba(126,200,255,0.18)",
    borderColor: "#7ec8ff",
  },
  optionText: { color: "#d9ecff", fontSize: 14 },
  optionTextSelected: { color: "#fff", fontWeight: "700" },
  optionSub: { color: "#7ec8ff", fontSize: 12, marginTop: 4 },
  loader: { marginVertical: 10 },
  emptyText: {
    color: "#7ec8ff",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 14,
  },
  hint: { color: "#9ecfff", fontSize: 12, lineHeight: 18, marginTop: 2 },
  datesRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  dateItem: { flex: 1 },
  dateValue: {
    color: "#d9ecff",
    fontSize: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
    backgroundColor: "rgba(126,200,255,0.08)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(126,200,255,0.15)",
    marginTop: 4,
  },
  actions: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    marginTop: 4,
  },
  btn: { minWidth: 120 },
});
