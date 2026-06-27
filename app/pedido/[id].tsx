import {
  atualizarStatusInterno,
  finalizarPedido,
  getRawOrder,
  SincOrder,
} from "@/services/Order";
import { getAllUsers, UserListItem } from "@/services/UserApi";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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
  const [finalizando, setFinalizando] = useState(false);

  type ItemBipeState = {
    input: string;
    confirmed: boolean;
    error: string | null;
  };
  const [itemBipe, setItemBipe] = useState<Record<string, ItemBipeState>>({});

  function getBipe(itemId: string): ItemBipeState {
    return itemBipe[itemId] ?? { input: "", confirmed: false, error: null };
  }

  function setItemInput(itemId: string, value: string) {
    setItemBipe((prev) => ({
      ...prev,
      [itemId]: { ...getBipe(itemId), input: value, error: null },
    }));
  }

  function confirmarBipe(itemId: string, loteSistema: string | undefined) {
    const current = getBipe(itemId);
    const valor = current.input.trim();
    if (!valor) return;

    if (!loteSistema) {
      setItemBipe((prev) => ({
        ...prev,
        [itemId]: {
          input: "",
          confirmed: false,
          error: "Este item não possui lote informado pelo sistema.",
        },
      }));
      return;
    }

    if (valor.toLowerCase() !== loteSistema.trim().toLowerCase()) {
      setItemBipe((prev) => ({
        ...prev,
        [itemId]: {
          input: "",
          confirmed: false,
          error: `Lote incorreto. Esperado: ${loteSistema}`,
        },
      }));
      return;
    }

    setItemBipe((prev) => ({
      ...prev,
      [itemId]: { input: "", confirmed: true, error: null },
    }));
  }

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

        // Ao abrir o pedido, marca statusInterno como "separacao"
        if (order.statusInterno !== "completo") {
          try {
            await atualizarStatusInterno(order.id, "separacao");
            order.statusInterno = "separacao";
          } catch {}
        }

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

  const itenComLote = pedido?.itens.filter((item) => item.lote) ?? [];
  const todosConfirmados =
    itenComLote.length > 0 &&
    itenComLote.every((item) => getBipe(item.id).confirmed);

  async function handleSalvar() {
    if (!pedido) return;
    setFinalizando(true);
    const novoStatus = todosConfirmados ? "completo" : "incompleto";
    try {
      await atualizarStatusInterno(pedido.id, novoStatus);
      setPedido((prev) =>
        prev ? { ...prev, statusInterno: novoStatus } : prev,
      );
      if (todosConfirmados) {
        await finalizarPedido(pedido.id);
      }
      Alert.alert(
        "Salvo",
        todosConfirmados
          ? "Pedido finalizado com todos os lotes confirmados!"
          : "Progresso salvo. Pedido marcado como incompleto.",
        [{ text: "OK", onPress: () => router.replace("/(tabs)/pedidos") }],
      );
    } catch {
      Alert.alert("Erro", "Não foi possível salvar. Tente novamente.");
    } finally {
      setFinalizando(false);
    }
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
            onPress={() => router.replace("/(tabs)/pedidos")}
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

            {/* Tag statusInterno */}
            {pedido.statusInterno && (
              <View
                style={[
                  styles.statusTag,
                  pedido.statusInterno === "completo" &&
                    styles.statusTagCompleto,
                  pedido.statusInterno === "incompleto" &&
                    styles.statusTagIncompleto,
                  pedido.statusInterno === "separacao" &&
                    styles.statusTagSeparacao,
                ]}
              >
                <Text style={styles.statusTagText}>
                  {pedido.statusInterno === "completo"
                    ? "Completo"
                    : pedido.statusInterno === "incompleto"
                      ? "Incompleto"
                      : "Em Separação"}
                </Text>
              </View>
            )}
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
              {pedido.itens.map((item) => {
                const bipe = getBipe(item.id);
                return (
                  <View
                    key={item.id}
                    style={[
                      styles.itemRow,
                      bipe.confirmed && styles.itemRowConfirmed,
                      bipe.error != null && styles.itemRowError,
                    ]}
                  >
                    <View style={styles.itemHeader}>
                      <Text style={styles.itemName}>
                        {item.nomeProduto || `Produto ${item.produto}`}
                      </Text>
                      {bipe.confirmed && (
                        <Ionicons
                          name="checkmark-circle"
                          size={20}
                          color="#4cff8f"
                        />
                      )}
                      {bipe.error && (
                        <Ionicons
                          name="close-circle"
                          size={20}
                          color="#ff6b6b"
                        />
                      )}
                    </View>
                    <Text style={styles.itemQtde}>Qtde: {item.qtde}</Text>
                    <Text style={styles.itemSub}>Lote: {item.lote ?? "-"}</Text>
                    <Text style={styles.itemSub}>
                      Validade: {item.dataValidade ?? "-"}
                    </Text>
                    <Text style={styles.itemSub}>
                      Localização: {item.localizacao ?? "-"}
                    </Text>

                    {/* Bipagem por item */}
                    {!bipe.confirmed && (
                      <View style={styles.bipeRow}>
                        <TextInput
                          style={[
                            styles.bipeInput,
                            bipe.error != null && styles.bipeInputError,
                          ]}
                          placeholder="Bipe o lote..."
                          placeholderTextColor="#557aa0"
                          value={bipe.input}
                          onChangeText={(t) => setItemInput(item.id, t)}
                          onSubmitEditing={() =>
                            confirmarBipe(item.id, item.lote)
                          }
                          returnKeyType="done"
                          autoCapitalize="characters"
                          autoCorrect={false}
                        />
                        <TouchableOpacity
                          style={styles.bipeBtn}
                          onPress={() => confirmarBipe(item.id, item.lote)}
                        >
                          <Ionicons
                            name="checkmark"
                            size={22}
                            color="#0a0a1a"
                          />
                        </TouchableOpacity>
                      </View>
                    )}
                    {bipe.error && (
                      <Text style={styles.bipeError}>{bipe.error}</Text>
                    )}
                    {bipe.confirmed && (
                      <Text style={styles.bipeConfirmed}>Lote confirmado!</Text>
                    )}
                  </View>
                );
              })}
            </View>
          )}
          {/* Botão Salvar */}
          <TouchableOpacity
            style={[
              styles.finalizarBtn,
              todosConfirmados
                ? styles.finalizarBtnCompleto
                : styles.finalizarBtnIncompleto,
            ]}
            onPress={handleSalvar}
            disabled={finalizando}
          >
            {finalizando ? (
              <ActivityIndicator color="#0a0a1a" />
            ) : (
              <>
                <Ionicons
                  name={todosConfirmados ? "checkmark-done" : "save-outline"}
                  size={22}
                  color="#0a0a1a"
                />
                <Text style={styles.finalizarBtnText}>
                  {todosConfirmados
                    ? "Finalizar Pedido"
                    : `Salvar como Incompleto (${Object.values(itemBipe).filter((b) => b.confirmed).length}/${itenComLote.length} lotes)`}
                </Text>
              </>
            )}
          </TouchableOpacity>
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
  itemRowConfirmed: {
    backgroundColor: "rgba(76,255,143,0.08)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#4cff8f",
    paddingLeft: 8,
  },
  itemRowError: {
    backgroundColor: "rgba(255,107,107,0.08)",
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: "#ff6b6b",
    paddingLeft: 8,
  },
  itemHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemName: {
    fontSize: 15,
    color: "#e0f0ff",
    fontWeight: "600",
    flex: 1,
  },
  bipeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  bipeInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "#1a3a8a",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    color: "#e0f0ff",
    fontSize: 15,
  },
  bipeBtn: {
    backgroundColor: "#7ec8ff",
    borderRadius: 10,
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  bipeInputError: {
    borderColor: "#ff6b6b",
  },
  bipeError: {
    color: "#ff6b6b",
    fontSize: 13,
    marginTop: 6,
  },
  bipeConfirmed: {
    color: "#4cff8f",
    fontSize: 13,
    marginTop: 4,
    fontWeight: "600",
  },
  finalizarBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    paddingVertical: 16,
    marginTop: 8,
  },
  finalizarBtnCompleto: {
    backgroundColor: "#4cff8f",
  },
  finalizarBtnIncompleto: {
    backgroundColor: "#f0a500",
  },
  finalizarBtnDisabled: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "#1a3a8a",
  },
  finalizarBtnText: {
    color: "#0a0a1a",
    fontWeight: "bold",
    fontSize: 17,
  },
  finalizarBtnTextDisabled: {
    color: "#557aa0",
  },
  statusTag: {
    alignSelf: "flex-start",
    marginTop: 10,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#557aa0",
  },
  statusTagCompleto: {
    borderColor: "#4cff8f",
    backgroundColor: "rgba(76,255,143,0.12)",
  },
  statusTagIncompleto: {
    borderColor: "#f0a500",
    backgroundColor: "rgba(240,165,0,0.12)",
  },
  statusTagSeparacao: {
    borderColor: "#7ec8ff",
    backgroundColor: "rgba(126,200,255,0.12)",
  },
  statusTagText: {
    fontSize: 12,
    fontWeight: "bold",
    color: "#e0f0ff",
    textTransform: "uppercase",
    letterSpacing: 1,
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
