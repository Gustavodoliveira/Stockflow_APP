import Button from "@/components/button";
import Input from "@/components/input";
import {
  createOrder,
  getOrderAll,
  OrderRequest,
  OrderStatus,
  updateOrderStatus,
} from "@/services/OrderProduction";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function formatDate(date: Date) {
  return date.toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

type OrdemResumo = {
  id: string;
  criadaEm: string;
  insumos: { produto: string }[];
  produtosFinal: { produto: string }[];
  status?: OrderStatus;
  serverOrderId?: string;
  userId?: string;
  userName?: string;
};

const STATUS_OPTIONS: Array<{ value: OrderStatus; label: string }> = [
  { value: OrderStatus.PENDING, label: "Pendente" },
  { value: OrderStatus.IN_PROGRESS, label: "Em produção" },
  { value: OrderStatus.COMPLETED, label: "Concluída" },
  { value: OrderStatus.CANCELLED, label: "Cancelada" },
];

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

export default function ProducaoScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [ordens, setOrdens] = useState<OrdemResumo[]>([]);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [selectedOrderForStatus, setSelectedOrderForStatus] =
    useState<OrdemResumo | null>(null);

  const carregarOrdens = useCallback(() => {
    let isActive = true;

    const carregar = async () => {
      try {
        const remoteOrders = await getOrderAll().catch(() => []);

        if (!isActive) return;

        const mapped = remoteOrders.map((item) => ({
          id: item.orderId ?? item.id ?? `${Date.now()}-${Math.random()}`,
          criadaEm: item.createdAt ?? new Date().toISOString(),
          insumos: [],
          produtosFinal: [],
          status: item.productionStatus ?? OrderStatus.PENDING,
          serverOrderId: item.orderId ?? item.id,
          userId: item.userId,
          userName: item.userName,
        }));

        setOrdens(mapped);
      } catch (error) {
        console.warn("Erro ao carregar ordens de produção:", error);
        if (!isActive) return;
        setOrdens([]);
      }
    };

    carregar();

    return () => {
      isActive = false;
    };
  }, []);

  useFocusEffect(carregarOrdens);

  async function handleChangeStatus(
    ordem: OrdemResumo,
    nextStatus: OrderStatus,
  ) {
    setUpdatingStatusId(ordem.id);

    try {
      const request: OrderRequest = {
        userId: ordem.userId ?? "",
        productionStatus: nextStatus,
      };

      let remoteOrder = null;
      if (ordem.serverOrderId) {
        remoteOrder = await updateOrderStatus(ordem.serverOrderId, request);
      } else {
        remoteOrder = await createOrder(request);
      }

      const updatedStatus = remoteOrder?.productionStatus ?? nextStatus;
      const remoteOrderId =
        (remoteOrder as { orderId?: string; id?: string } | null)?.orderId ??
        (remoteOrder as { orderId?: string; id?: string } | null)?.id;

      const updated = ordens.map((item) =>
        item.id === ordem.id
          ? {
              ...item,
              status: updatedStatus,
              serverOrderId: remoteOrderId ?? item.serverOrderId,
              userId: request.userId,
            }
          : item,
      );

      setOrdens(updated);
      setShowStatusMenu(false);
      setSelectedOrderForStatus(null);
    } catch (error) {
      console.warn("Erro ao atualizar o status da ordem:", error);
    } finally {
      setUpdatingStatusId(null);
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
        <View style={styles.header}>
          <Image
            source={require("../../assets/images/Logo futurista ASTRALIS com estrela.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={styles.dateContainer}
            onPress={() => setShowPicker(true)}
          >
            <Ionicons name="calendar-outline" size={14} color="#7ec8ff" />
            <Text style={styles.dateText}>{formatDate(date)}</Text>
          </TouchableOpacity>
        </View>
        {showPicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display={Platform.OS === "ios" ? "spinner" : "default"}
            onChange={(_, selected) => {
              setShowPicker(Platform.OS === "ios");
              if (selected) setDate(selected);
            }}
          />
        )}
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.title}>Ordem de Produção</Text>
          <View style={styles.actions}>
            <Input
              placeholder="Buscar ordem de produção"
              icon={
                <Ionicons name="search-outline" size={18} color="#4a6aaa" />
              }
            />
            <Button
              title="Criar Ordem de Produção"
              icon="add-circle-outline"
              onPress={() => router.push("/order-production/order")}
            />
          </View>

          {ordens.length > 0 && (
            <View style={styles.ordensSection}>
              <Text style={styles.sectionTitle}>Ordens Salvas</Text>
              {[...ordens].reverse().map((ordem) => (
                <View key={ordem.id} style={styles.ordemCard}>
                  <TouchableOpacity
                    style={styles.ordemCardContent}
                    activeOpacity={0.8}
                    onPress={() =>
                      router.push(`/order-production/order?orderId=${ordem.id}`)
                    }
                  >
                    <View style={styles.ordemCardLeft}>
                      <Text style={styles.ordemCardDate}>
                        {new Date(ordem.criadaEm).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                      <Text style={styles.ordemCardInfo}>
                        ID: {ordem.serverOrderId ?? ordem.id}
                      </Text>
                      <Text style={styles.ordemCardInfo}>
                        Usuário: {ordem.userName || ordem.userId || "-"}
                      </Text>
                      <Text style={styles.ordemCardInfo}>
                        {ordem.insumos.length} insumo(s) ·{" "}
                        {ordem.produtosFinal.length} produto(s) final
                      </Text>
                    </View>
                    <Ionicons
                      name="chevron-forward"
                      size={18}
                      color="#7ec8ff"
                    />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusPill}
                    onPress={() => router.push({
                      pathname: "/order-production/reports",
                      params: { orderId: ordem.serverOrderId ?? ordem.id }
                    })}
                  >
                    <Text style={styles.statusPillText}>Preencher / Baixar PDFs</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.statusPill}
                    activeOpacity={0.8}
                    onPress={() => {
                      setSelectedOrderForStatus(ordem);
                      setShowStatusMenu(true);
                    }}
                    disabled={updatingStatusId === ordem.id}
                  >
                    <Text style={styles.statusPillText}>
                      {updatingStatusId === ordem.id
                        ? "..."
                        : getStatusLabel(ordem.status)}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <Modal
          transparent
          visible={showStatusMenu}
          animationType="fade"
          onRequestClose={() => {
            setShowStatusMenu(false);
            setSelectedOrderForStatus(null);
          }}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => {
              setShowStatusMenu(false);
              setSelectedOrderForStatus(null);
            }}
          >
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Alterar status</Text>
              {STATUS_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={styles.modalOption}
                  onPress={() => {
                    if (selectedOrderForStatus) {
                      handleChangeStatus(selectedOrderForStatus, option.value);
                    }
                  }}
                >
                  <Text style={styles.modalOptionText}>{option.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  logo: { width: 80, height: 80 },
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingRight: 4,
  },
  dateText: {
    color: "#7ec8ff",
    fontSize: 12,
    textTransform: "capitalize",
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 32,
  },
  actions: {
    width: "100%",
    paddingHorizontal: 28,
    gap: 14,
    marginTop: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#a8d8ff",
    letterSpacing: 2,
    textAlign: "center",
  },
  ordensSection: {
    width: "100%",
    paddingHorizontal: 28,
    marginTop: 28,
    gap: 10,
  },
  sectionTitle: {
    color: "#7ec8ff",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  ordemCard: {
    backgroundColor: "rgba(126,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(126,200,255,0.2)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  ordemCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ordemCardLeft: { gap: 4, flex: 1 },
  ordemCardDate: { color: "#d9ecff", fontSize: 13, fontWeight: "600" },
  ordemCardInfo: { color: "#7ec8ff", fontSize: 12 },
  statusPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(126, 200, 255, 0.16)",
    borderColor: "rgba(126, 200, 255, 0.24)",
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  statusPillText: {
    color: "#d9ecff",
    fontSize: 11,
    fontWeight: "700",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(2, 6, 23, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#0f1733",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(126, 200, 255, 0.2)",
    padding: 16,
    gap: 8,
  },
  modalTitle: {
    color: "#d9ecff",
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  modalOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(126, 200, 255, 0.1)",
  },
  modalOptionText: {
    color: "#d9ecff",
    fontSize: 13,
  },
});
