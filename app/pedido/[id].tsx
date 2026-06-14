import { getRawOrder, SincOrder } from "@/services/Order";
import { getAllUsers, UserListItem } from "@/services/UserApi";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CACHE_KEY = "@pedidos_cache";

export default function SeparacaoScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const [pedido, setPedido] = useState<SincOrder | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserListItem | null>(null);
  const [loadingPedido, setLoadingPedido] = useState(true);

  useEffect(() => {
    async function loadPedido() {
      if (!id) return;
      setLoadingPedido(true);
      try {
        // Carrega dados atualizados da API
        const order = await getRawOrder(id);
        console.log("=== getRawOrder response ===");
        console.log(JSON.stringify(order, null, 2));
        if (order.itens?.length) {
          console.log("=== Primeiro item ===");
          console.log(JSON.stringify(order.itens[0], null, 2));
        }
        setPedido(order);

        // Se já tem separador, busca os usuários e pré-seleciona
        if (order.userId) {
          const allUsers = await getAllUsers();
          const separador = allUsers.find((u) => u.id === order.userId) ?? null;
          setSelectedUser(separador);
        }
      } catch (e) {
        console.log("Erro ao carregar pedido:", e);
        // Fallback para cache
        try {
          const cached = await AsyncStorage.getItem(CACHE_KEY);
          if (cached) {
            const pedidos: SincOrder[] = JSON.parse(cached);
            const found = pedidos.find((p) => p.id === id) ?? null;
            setPedido(found);
          }
        } catch {}
      } finally {
        setLoadingPedido(false);
      }
    }
    loadPedido();
  }, [id]);

  async function openUserModal() {
    // seleção feita na tela de pedidos
  }

  function handleUserSelect(_user: UserListItem) {}
  async function handleConfirmSave() {}
  function handleConfirmCancel() {}

  if (loadingPedido) {
    return (
      <LinearGradient
        colors={["#0a0a1a", "#0d0d3b", "#1a0a4a", "#2d0a6e", "#1a3a8a"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator color="#7ec8ff" size="large" />
      </LinearGradient>
    );
  }

  if (!pedido) {
    return (
      <LinearGradient
        colors={["#0a0a1a", "#0d0d3b", "#1a0a4a", "#2d0a6e", "#1a3a8a"]}
        style={{ flex: 1, justifyContent: "center", alignItems: "center" }}
      >
        <ActivityIndicator color="#7ec8ff" />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#0a0a1a", "#0d0d3b", "#1a0a4a", "#2d0a6e", "#1a3a8a"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backBtn}
          >
            <Ionicons name="arrow-back" size={24} color="#7ec8ff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Separação</Text>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Info do pedido */}
          <View style={styles.card}>
            <Text style={styles.label}>Pedido</Text>
            <Text style={styles.value}>{pedido.numeroPedido}</Text>

            <Text style={styles.label}>Cliente</Text>
            <Text style={styles.value}>{pedido.nomeCliente || "-"}</Text>

            <Text style={styles.label}>Status</Text>
            <Text style={styles.value}>{pedido.status || "-"}</Text>

            {pedido.dataPrevisao && (
              <>
                <Text style={styles.label}>Previsão</Text>
                <Text style={styles.value}>{pedido.dataPrevisao}</Text>
              </>
            )}

            <Text style={styles.label}>Total</Text>
            <Text style={styles.value}>R$ {pedido.valorTotal}</Text>
          </View>

          {/* Separador */}
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>Separador</Text>
            {selectedUser ? (
              <View style={styles.separadorRow}>
                <Ionicons
                  name="person-circle-outline"
                  size={28}
                  color="#7ec8ff"
                />
                <Text style={styles.separadorName}>{selectedUser.name}</Text>
              </View>
            ) : (
              <Text style={styles.value}>Nenhum separador definido</Text>
            )}
          </View>

          {/* Itens do pedido */}
          {pedido.itens && pedido.itens.length > 0 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>
                Itens ({pedido.itens.length})
              </Text>
              {pedido.itens.map((item) => (
                <View key={item.id} style={styles.itemRow}>
                  <Text style={styles.itemName}>
                    {item.nomeProduto || `Produto ${item.produto}`}
                  </Text>
                  <Text style={styles.itemQtde}>Qtde: {item.qtde}</Text>
                  <Text style={styles.itemSub}>Lote: {item.lote ?? "-"}</Text>
                  <Text style={styles.itemSub}>
                    Validade: {item.dataValidade ?? "-"}
                  </Text>
                  <Text style={styles.itemSub}>
                    Localização: {item.localizacao ?? "-"}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#a8d8ff",
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 32,
    gap: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#1a3a8a",
    gap: 4,
  },
  label: {
    fontSize: 12,
    color: "#7ec8ff",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 8,
  },
  value: {
    fontSize: 16,
    color: "#e0f0ff",
    fontWeight: "500",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a8d8ff",
    marginBottom: 12,
  },
  separadorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  separadorName: {
    flex: 1,
    fontSize: 16,
    color: "#e0f0ff",
    fontWeight: "600",
  },
  changeBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "#1a3a8a",
  },
  changeBtnText: {
    color: "#7ec8ff",
    fontSize: 14,
    fontWeight: "bold",
  },
  selectBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#7ec8ff",
    borderRadius: 10,
    paddingVertical: 12,
  },
  selectBtnText: {
    color: "#0a0a1a",
    fontWeight: "bold",
    fontSize: 16,
  },
  itemRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  itemName: {
    fontSize: 15,
    color: "#e0f0ff",
    fontWeight: "600",
  },
  itemQtde: {
    fontSize: 13,
    color: "#7ec8ff",
    marginTop: 2,
  },
  itemSub: {
    fontSize: 12,
    color: "#a8d8ff",
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#101a2a",
    borderRadius: 16,
    padding: 24,
    width: 320,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#a8d8ff",
    marginBottom: 16,
  },
  userOption: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#1a3a8a",
    marginBottom: 8,
    alignItems: "center",
  },
  userOptionSelected: { backgroundColor: "#7ec8ff" },
  userOptionText: { color: "#e0f0ff", fontSize: 16 },
  userOptionTextSelected: { color: "#0a0a1a", fontWeight: "bold" },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#a8d8ff",
  },
  closeModalText: { color: "#0a0a1a", fontWeight: "bold", fontSize: 16 },
  confirmText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#7ec8ff",
    marginBottom: 6,
  },
  confirmSub: {
    fontSize: 14,
    color: "#e0f0ff",
    textAlign: "center",
    marginBottom: 20,
  },
  confirmButtons: { flexDirection: "row", gap: 12 },
  btnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#7ec8ff",
    alignItems: "center",
  },
  btnSaveText: { color: "#0a0a1a", fontWeight: "bold", fontSize: 16 },
  btnDelete: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3a1a2a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  btnDeleteText: { color: "#ff6b6b", fontWeight: "bold", fontSize: 16 },
});
