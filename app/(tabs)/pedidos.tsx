import { sincOrder, SincOrder } from "@/services/Order";
import { getAllUsers, UserListItem } from "@/services/UserApi";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [pedidos, setPedidos] = useState<SincOrder[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [pedidoIdToSetUser, setPedidoIdToSetUser] = useState<string | null>(
    null,
  );

  async function handleSync() {
    setLoading(true);
    try {
      const result = await sincOrder();
      console.log("Resposta da API de pedidos:", result);
      setPedidos(result);
    } catch (e) {
      setPedidos([]);
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
    setSelectedUserId(userId);
    setModalVisible(false);
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
                <Text style={styles.cardTitle}>
                  Pedido: {item.numeroPedido}
                </Text>
                <Text style={styles.cardSub}>
                  Cliente: {item.nomeCliente || "-"}
                </Text>
                <TouchableOpacity
                  style={styles.userIdButton}
                  onPress={() => openUserSelect(item.id)}
                >
                  <Text
                    style={[
                      styles.cardSub,
                      styles.userIdText,
                      selectedUserId && styles.userIdSelected,
                    ]}
                  >
                    {selectedUserId && users.length > 0
                      ? `Usuário: ${getUserNameById(selectedUserId)}`
                      : `Selecionar usuário`}
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
                          selectedUserId === user.id &&
                            styles.userOptionSelected,
                        ]}
                        onPress={() => handleUserSelect(user.id)}
                      >
                        <Text
                          style={[
                            styles.userOptionText,
                            selectedUserId === user.id &&
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
    backgroundColor: "#1a3a8a",
    alignSelf: "flex-start",
  },
  userIdText: {
    color: "#7ec8ff",
    fontWeight: "bold",
  },
  userIdSelected: {
    backgroundColor: "#7ec8ff",
    color: "#0a0a1a",
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
