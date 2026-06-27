import { setUserInOrder, sincOrder, SincOrder } from "@/services/Order";
import { getAllUsers, UserListItem } from "@/services/UserApi";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Button } from "../../components/button";

export default function PedidosScreen() {
  const CACHE_KEY = "@pedidos_cache";
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<SincOrder[]>([]);

  useEffect(() => {
    async function loadCache() {
      try {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const list: SincOrder[] = JSON.parse(cached);
          setPedidos(list);
          initSeparadores(list);
        }
      } catch {}
    }
    async function loadUsers() {
      try {
        const result = await getAllUsers();
        setUsers(result);
      } catch {}
    }
    loadCache();
    loadUsers();
  }, []);
  const [separadores, setSeparadores] = useState<Record<string, string>>({});
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoIdToSetUser, setPedidoIdToSetUser] = useState<string | null>(
    null,
  );
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [tempSelectedUser, setTempSelectedUser] = useState<UserListItem | null>(
    null,
  );

  function initSeparadores(list: SincOrder[]) {
    const map: Record<string, string> = {};
    list.forEach((p) => {
      if (p.userId) map[p.id] = p.userId;
    });
    setSeparadores(map);
  }

  async function handleSync() {
    setLoading(true);
    try {
      const result = await sincOrder();
      setPedidos(result);
      initSeparadores(result);
      await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(result));
    } catch (e) {
      console.log("Erro ao sincronizar pedidos:", e);
    } finally {
      setLoading(false);
    }
  }

  async function openUserSelect(pedidoId: string) {
    setPedidoIdToSetUser(pedidoId);
    setModalVisible(true);
    if (users.length === 0) {
      setLoadingUsers(true);
      try {
        const result = await getAllUsers();
        setUsers(result);
      } catch {}
      setLoadingUsers(false);
    }
  }

  function handleUserSelect(userId: string) {
    const user = users.find((u) => u.id === userId) ?? null;
    setTempSelectedUser(user);
    setModalVisible(false);
    setConfirmModalVisible(true);
  }

  async function handleConfirmSave() {
    if (tempSelectedUser && pedidoIdToSetUser) {
      console.log(
        "Salvando separador — orderId:",
        pedidoIdToSetUser,
        "| userId:",
        tempSelectedUser.id,
      );
      try {
        await setUserInOrder(pedidoIdToSetUser, tempSelectedUser.id);
        setSeparadores((prev) => ({
          ...prev,
          [pedidoIdToSetUser]: tempSelectedUser.id,
        }));
        // Atualiza pedidos em memória e cache para persistir o separador
        const updatedPedidos = pedidos.map((p) =>
          p.id === pedidoIdToSetUser
            ? { ...p, userId: tempSelectedUser.id }
            : p,
        );
        setPedidos(updatedPedidos);
        await AsyncStorage.setItem(CACHE_KEY, JSON.stringify(updatedPedidos));
        console.log("Separador salvo com sucesso.");
      } catch (e) {
        console.log("Erro ao salvar separador:", e);
      }
    }
    setTempSelectedUser(null);
    setConfirmModalVisible(false);
  }

  function handleConfirmDelete() {
    setTempSelectedUser(null);
    setConfirmModalVisible(false);
  }

  function getUserNameById(userId: string | null) {
    if (!userId) return "-";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : userId;
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
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Bem Vindo aos Pedidos</Text>
          <Button
            title="Sincronizar Pedidos"
            onPress={handleSync}
            loading={loading}
          />
          {loading && (
            <ActivityIndicator color="#7ec8ff" style={{ marginTop: 24 }} />
          )}
          <FlatList
            data={pedidos}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <TouchableOpacity
                  onPress={() => router.push(`/pedido/${item.id}`)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.cardTitle}>
                    Pedido: {item.numeroPedido}
                  </Text>
                  <Text style={styles.cardSub}>
                    Cliente: {item.nomeCliente || "-"}
                  </Text>
                  <Text style={styles.cardSub}>
                    Status: {item.status || "-"}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.userIdButton,
                    separadores[item.id] ? styles.userIdSelected : null,
                  ]}
                  onPress={() => openUserSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.userIdText,
                      separadores[item.id] ? styles.userIdTextSelected : null,
                    ]}
                  >
                    {separadores[item.id]
                      ? `Separador: ${getUserNameById(separadores[item.id])}`
                      : "Selecionar Separador"}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
            ListEmptyComponent={
              !loading && pedidos.length === 0 ? (
                <Text style={styles.empty}>Nenhum pedido sincronizado.</Text>
              ) : null
            }
          />
          <Modal
            visible={modalVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Selecione um usuário</Text>
                {loadingUsers ? (
                  <ActivityIndicator
                    color="#7ec8ff"
                    style={{ marginTop: 24 }}
                  />
                ) : (
                  <ScrollView style={{ maxHeight: 300 }}>
                    {users.map((user) => (
                      <TouchableOpacity
                        key={user.id}
                        style={[
                          styles.userOption,
                          pedidoIdToSetUser &&
                            separadores[pedidoIdToSetUser] === user.id &&
                            styles.userOptionSelected,
                        ]}
                        onPress={() => handleUserSelect(user.id)}
                      >
                        <Text
                          style={[
                            styles.userOptionText,
                            pedidoIdToSetUser &&
                              separadores[pedidoIdToSetUser] === user.id &&
                              styles.userOptionTextSelected,
                          ]}
                        >
                          {user.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setModalVisible(false)}
                >
                  <Text style={styles.closeModalText}>Cancelar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          <Modal
            visible={confirmModalVisible}
            transparent
            animationType="fade"
            onRequestClose={handleConfirmDelete}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Confirmar Separador</Text>
                <Text style={styles.confirmText}>
                  {tempSelectedUser?.name ?? "-"}
                </Text>
                <Text style={styles.confirmSub}>
                  Deseja salvar este separador para o pedido?
                </Text>
                <View style={styles.confirmButtons}>
                  <TouchableOpacity
                    style={styles.btnDelete}
                    onPress={handleConfirmDelete}
                  >
                    <Text style={styles.btnDeleteText}>Excluir</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.btnSave}
                    onPress={handleConfirmSave}
                  >
                    <Text style={styles.btnSaveText}>Salvar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
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
  userOptionSelected: {
    backgroundColor: "#7ec8ff",
  },
  userOptionText: {
    color: "#e0f0ff",
    fontSize: 16,
  },
  userOptionTextSelected: {
    color: "#0a0a1a",
    fontWeight: "bold",
  },
  closeModalButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 8,
    backgroundColor: "#a8d8ff",
  },
  closeModalText: {
    color: "#0a0a1a",
    fontWeight: "bold",
    fontSize: 16,
  },
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, alignItems: "flex-start" },
  logo: { width: 80, height: 80 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
  },
  list: {
    width: "100%",
    marginTop: 16,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.07)",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#1a3a8a",
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#a8d8ff",
    marginBottom: 4,
  },
  cardSub: {
    fontSize: 14,
    color: "#e0f0ff",
    marginBottom: 2,
  },
  userIdButton: {
    marginTop: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#1a3a8a",
    alignSelf: "flex-start",
  },
  userIdText: {
    color: "#7ec8ff",
    fontWeight: "bold",
  },
  userIdSelected: {
    backgroundColor: "transparent",
    borderColor: "#7ec8ff",
  },
  userIdTextSelected: {
    color: "#7ec8ff",
  },
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
  confirmButtons: {
    flexDirection: "row",
    gap: 12,
  },
  btnSave: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#7ec8ff",
    alignItems: "center",
  },
  btnSaveText: {
    color: "#0a0a1a",
    fontWeight: "bold",
    fontSize: 16,
  },
  btnDelete: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#3a1a2a",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ff6b6b",
  },
  btnDeleteText: {
    color: "#ff6b6b",
    fontWeight: "bold",
    fontSize: 16,
  },
  empty: {
    color: "#a8d8ff",
    textAlign: "center",
    marginTop: 24,
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#a8d8ff",
    letterSpacing: 2,
    textAlign: "center",
  },
});
