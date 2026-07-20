import Button from "@/components/button";
import ProdutoLoteModal from "@/components/ProdutoLoteModal";
import { getUser } from "@/services/auth";
import {
  createOrder,
  deleteOrder,
  OrderRequest,
  OrderResponse,
  OrderStatus,
  updateOrderStatus,
} from "@/services/OrderProduction";
import { Lote, Produto } from "@/services/StockApi";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type ItemAdicionado = {
  produtoId: number;
  produto: string;
  loteId: number;
  lote: string;
  dataFabricacao: string;
  dataValidade: string;
};

type Ordem = {
  id: string;
  criadaEm: string;
  insumos: ItemAdicionado[];
  produtosFinal: ItemAdicionado[];
  status?: OrderStatus;
  userId?: string;
  serverOrderId?: string;
};

function gerarLoteAutomatico(): string {
  const d = new Date();
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = String(d.getFullYear()).slice(-2);
  return `${dd}${mm}${yy}BRI`;
}

function getStatusLabel(status?: OrderStatus): string {
  switch (status) {
    case OrderStatus.IN_PROGRESS:
      return "Em produção";
    case OrderStatus.COMPLETED:
      return "Concluída";
    case OrderStatus.CANCELLED:
      return "Cancelada";
    default:
      return "Pendente";
  }
}

export default function OrderScreen() {
  const [insumoModal, setInsumoModal] = useState(false);
  const [produtoFinalModal, setProdutoFinalModal] = useState(false);
  const [insumos, setInsumos] = useState<ItemAdicionado[]>([]);
  const [produtosFinal, setProdutosFinal] = useState<ItemAdicionado[]>([]);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<OrderStatus>(
    OrderStatus.PENDING,
  );
  const [editingInsumoIndex, setEditingInsumoIndex] = useState<number | null>(
    null,
  );
  const [editingProdutoFinalIndex, setEditingProdutoFinalIndex] = useState<
    number | null
  >(null);

  const loteAutomatico = gerarLoteAutomatico();
  const { orderId } = useLocalSearchParams<{ orderId?: string }>();

  useEffect(() => {
    if (!orderId) return;
    setInsumos([]);
    setProdutosFinal([]);
    setCurrentStatus(OrderStatus.PENDING);
  }, [orderId]);

  function replaceOrAddItem(
    setter: React.Dispatch<React.SetStateAction<ItemAdicionado[]>>,
    editIndex: number | null,
    produto: Produto,
    lote: Lote,
    dataFabricacao: string,
    dataValidade: string,
  ) {
    const newItem: ItemAdicionado = {
      produtoId: produto.id,
      produto: produto.descricao,
      loteId: lote.id,
      lote: lote.identificacao,
      dataFabricacao,
      dataValidade,
    };
    setter((current) => {
      if (editIndex !== null) {
        const updated = [...current];
        updated[editIndex] = newItem;
        return updated;
      }
      return [...current, newItem];
    });
  }

  const canSave = insumos.length > 0 || produtosFinal.length > 0;

  async function handleExcluir() {
    if (!orderId || deleting) return;

    setDeleting(true);
    try {
      await deleteOrder(orderId);
      router.replace("/(tabs)/producao");
    } catch (error) {
      console.warn("Erro ao excluir ordem de produção:", error);
    } finally {
      setDeleting(false);
    }
  }

  async function handleSalvar() {
    if (!canSave || saving) return;
    setSaving(true);
    try {
      const user = await getUser();
      const request: OrderRequest = {
        userId: user?.id ?? "",
        productionStatus: currentStatus,
      };

      let remoteOrder: OrderResponse | null = null;
      try {
        if (orderId) {
          remoteOrder = await updateOrderStatus(orderId, request);
        } else {
          remoteOrder = await createOrder(request);
        }
      } catch (error) {
        console.warn("Erro ao sincronizar ordem de produção:", error);
      }

      const remoteOrderId =
        (remoteOrder as (OrderResponse & { id?: string }) | null)?.orderId ??
        (remoteOrder as (OrderResponse & { id?: string }) | null)?.id ??
        orderId;

      const nextOrder: Ordem = {
        id: orderId ?? remoteOrderId ?? `${Date.now()}`,
        criadaEm: new Date().toISOString(),
        insumos,
        produtosFinal,
        status: remoteOrder?.productionStatus ?? currentStatus,
        userId: request.userId,
        serverOrderId: remoteOrderId,
      };

      if (orderId) {
        // a ordem já é tratada pelo backend; mantemos apenas o estado local para a tela atual
      }
      router.replace("/(tabs)/producao");
    } catch {
      setSaving(false);
    } finally {
      setSaving(false);
    }
  }

  return (
    <LinearGradient
      colors={["#0a0a1a", "#0d0d3b", "#1a0a4a", "#2d0a6e", "#1a3a8a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        <View style={styles.content}>
          <View style={styles.topSection}>
            <Text style={styles.text}>Order number:</Text>

            <View style={styles.statusRow}>
              <Text style={styles.text}>Status da ordem:</Text>
              <View style={styles.statusButton}>
                <Text style={styles.statusButtonText}>
                  {getStatusLabel(currentStatus)}
                </Text>
              </View>
            </View>

            <View style={styles.leftButtonRow}>
              <Button
                title="Adicionar Insumo"
                style={styles.inlineButton}
                onPress={() => setInsumoModal(true)}
              />
            </View>

            <ItemList
              items={insumos}
              emptyText="Os insumos adicionados podem aparecer aqui."
              onEdit={(index) => {
                setEditingInsumoIndex(index);
                setInsumoModal(true);
              }}
            />

            <View style={styles.productSection}>
              <View style={styles.leftButtonRow}>
                <Button
                  title="Adicionar Produto Final"
                  style={styles.inlineButton}
                  onPress={() => setProdutoFinalModal(true)}
                />
              </View>
              <ItemList
                items={produtosFinal}
                emptyText="O produto final pode aparecer abaixo deste botão."
                onEdit={(index) => {
                  setEditingProdutoFinalIndex(index);
                  setProdutoFinalModal(true);
                }}
              />
            </View>
          </View>

          <View style={styles.bottomActions}>
            <Button
              title="Excluir"
              variant="outline"
              style={styles.footerButton}
              disabled={deleting || !orderId}
              loading={deleting}
              onPress={handleExcluir}
            />
            <Button
              title="Salvar"
              style={styles.footerButton}
              disabled={!canSave}
              loading={saving}
              onPress={handleSalvar}
            />
          </View>
        </View>

        <ProdutoLoteModal
          visible={insumoModal}
          title={
            editingInsumoIndex !== null ? "Editar Insumo" : "Buscar Insumo"
          }
          onClose={() => {
            setInsumoModal(false);
            setEditingInsumoIndex(null);
          }}
          onConfirm={(p, l, fab, val) => {
            replaceOrAddItem(setInsumos, editingInsumoIndex, p, l, fab, val);
            setInsumoModal(false);
            setEditingInsumoIndex(null);
          }}
        />

        <ProdutoLoteModal
          visible={produtoFinalModal}
          title={
            editingProdutoFinalIndex !== null
              ? "Editar Produto Final"
              : "Buscar Produto Final"
          }
          autoLote={loteAutomatico}
          manualDates
          onClose={() => {
            setProdutoFinalModal(false);
            setEditingProdutoFinalIndex(null);
          }}
          onConfirm={(p, l, fab, val) => {
            replaceOrAddItem(
              setProdutosFinal,
              editingProdutoFinalIndex,
              p,
              l,
              fab,
              val,
            );
            setProdutoFinalModal(false);
            setEditingProdutoFinalIndex(null);
          }}
        />
      </SafeAreaView>
    </LinearGradient>
  );
}

function formatDate(iso: string): string {
  if (!iso) return "-";
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(iso)) return iso;
  try {
    return new Date(iso).toLocaleDateString("pt-BR");
  } catch {
    return iso;
  }
}

function ItemList({
  items,
  emptyText,
  onEdit,
}: {
  items: ItemAdicionado[];
  emptyText: string;
  onEdit: (index: number) => void;
}) {
  return (
    <View style={styles.listArea}>
      {items.length === 0 ? (
        <Text style={styles.helperText}>{emptyText}</Text>
      ) : (
        <View style={styles.itemsList}>
          {items.map((item, index) => (
            <TouchableOpacity
              key={`${item.produtoId}-${item.loteId}-${index}`}
              style={styles.itemCard}
              onPress={() => onEdit(index)}
              activeOpacity={0.7}
            >
              <Text style={styles.itemTitle} numberOfLines={1}>
                {item.produto}
              </Text>
              <Text style={styles.itemSubtitle}>
                Lote: {item.lote} · Fab: {formatDate(item.dataFabricacao)} ·
                Val: {formatDate(item.dataValidade)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  content: { flex: 1, paddingHorizontal: 24, paddingTop: 32 },
  topSection: { flex: 1 },
  leftButtonRow: { width: "100%", alignItems: "flex-start", marginTop: 18 },
  inlineButton: { minWidth: 190 },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    marginTop: 12,
    marginBottom: 4,
  },
  statusButton: {
    backgroundColor: "rgba(126, 200, 255, 0.16)",
    borderColor: "rgba(126, 200, 255, 0.28)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  statusButtonText: {
    color: "#d9ecff",
    fontSize: 12,
    fontWeight: "700",
  },
  listArea: {
    width: "100%",
    backgroundColor: "rgba(10, 10, 26, 0.45)",
    borderWidth: 1,
    borderColor: "rgba(126, 200, 255, 0.2)",
    borderRadius: 18,
    padding: 20,
    marginTop: 16,
    minHeight: 150,
    justifyContent: "center",
  },
  productSection: { marginTop: 36 },
  text: { color: "#d9ecff", fontSize: 16, lineHeight: 24, textAlign: "left" },
  helperText: {
    color: "#7ec8ff",
    fontSize: 15,
    lineHeight: 22,
    textAlign: "left",
  },
  itemsList: { gap: 6 },
  itemCard: {
    backgroundColor: "rgba(126, 200, 255, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(126, 200, 255, 0.18)",
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  itemTitle: { color: "#d9ecff", fontSize: 13, fontWeight: "700" },
  itemSubtitle: { color: "#7ec8ff", fontSize: 11, marginTop: 3 },
  bottomActions: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
    paddingTop: 20,
    paddingBottom: 20,
  },
  footerButton: { minWidth: 140 },
});
