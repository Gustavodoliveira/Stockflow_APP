import Input from "@/components/input";
import {
  getLotesByLocalizacao,
  getLotesByProdutoId,
  getProdutosByDescription,
  Lote,
  Produto,
} from "@/services/StockApi";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
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

export default function EstoqueScreen() {
  const [query, setQuery] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null);
  const [lotes, setLotes] = useState<Lote[]>([]);
  const [loadingLotes, setLoadingLotes] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [queryLocalizacao, setQueryLocalizacao] = useState("");
  const [lotesLocalizacao, setLotesLocalizacao] = useState<Lote[]>([]);
  const [loadingLocalizacao, setLoadingLocalizacao] = useState(false);
  const [modalLocalizacaoVisible, setModalLocalizacaoVisible] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setProdutos([]);
      return;
    }
    setLoading(true);
    try {
      const result = await getProdutosByDescription(text.trim());
      setProdutos(result);
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearchLocalizacao(text: string) {
    setQueryLocalizacao(text);
    if (text.trim().length < 2) {
      setLotesLocalizacao([]);
      return;
    }
    setLoadingLocalizacao(true);
    setModalLocalizacaoVisible(true);
    try {
      const result = await getLotesByLocalizacao(text.trim());
      setLotesLocalizacao(result);
    } catch {
      setLotesLocalizacao([]);
    } finally {
      setLoadingLocalizacao(false);
    }
  }

  async function handleCardPress(produto: Produto) {
    setSelectedProduto(produto);
    setLotes([]);
    setModalVisible(true);
    setLoadingLotes(true);
    try {
      const result = await getLotesByProdutoId(produto.id);
      setLotes(result);
    } catch {
      setLotes([]);
    } finally {
      setLoadingLotes(false);
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
        </View>
        <View style={styles.content}>
          <Text style={styles.title}>Bem Vindo ao Estoque</Text>
          <View style={styles.searchContainer}>
            <Input
              placeholder="Consultar produtos"
              value={query}
              onChangeText={handleSearch}
              icon={
                <Ionicons name="search-outline" size={18} color="#4a6aaa" />
              }
            />
            <Input
              placeholder="Consultar lotes por localização"
              value={queryLocalizacao}
              onChangeText={handleSearchLocalizacao}
              icon={
                <Ionicons name="location-outline" size={18} color="#4a6aaa" />
              }
            />
            <Input placeholder="Consultar lote" />
          </View>

          {loading && (
            <ActivityIndicator color="#7ec8ff" style={{ marginTop: 24 }} />
          )}

          <FlatList
            data={produtos}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() => handleCardPress(item)}
                activeOpacity={0.7}
              >
                <Text style={styles.cardTitle}>{item.descricao}</Text>
                <Text style={styles.cardSub}>
                  {item.identificacao} · {item.unidadeMedida}
                </Text>
                <Text style={styles.cardSub}>
                  Localização: {item.localizacao}
                </Text>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              !loading && query.length >= 2 ? (
                <Text style={styles.empty}>Nenhum produto encontrado.</Text>
              ) : null
            }
          />
        </View>
      </SafeAreaView>

      <Modal
        visible={modalLocalizacaoVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalLocalizacaoVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                Lotes em "{queryLocalizacao}"
              </Text>
              <TouchableOpacity
                onPress={() => setModalLocalizacaoVisible(false)}
              >
                <Ionicons name="close" size={22} color="#a8d8ff" />
              </TouchableOpacity>
            </View>
            {loadingLocalizacao ? (
              <ActivityIndicator color="#7ec8ff" style={{ marginTop: 24 }} />
            ) : lotesLocalizacao.length === 0 ? (
              <Text style={styles.empty}>Nenhum lote encontrado.</Text>
            ) : (
              <ScrollView>
                {lotesLocalizacao.map((lote) => (
                  <View key={lote.id} style={styles.loteCard}>
                    <Text style={styles.loteTitle}>
                      {lote.produtoNome ?? lote.descricao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Lote: {lote.identificacao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Depósito: {lote.depositoDescricao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Localização: {lote.localizacao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Validade: {lote.dataValidade}
                    </Text>
                    <View style={styles.loteRow}>
                      <Text style={styles.loteBadge}>
                        Qtd: {lote.quantidade}
                      </Text>
                      <Text style={styles.loteBadge}>Saldo: {lote.saldo}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {selectedProduto?.descricao}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#a8d8ff" />
              </TouchableOpacity>
            </View>

            {loadingLotes ? (
              <ActivityIndicator color="#7ec8ff" style={{ marginTop: 24 }} />
            ) : lotes.length === 0 ? (
              <Text style={styles.empty}>Nenhum lote encontrado.</Text>
            ) : (
              <ScrollView>
                {lotes.map((lote) => (
                  <View key={lote.id} style={styles.loteCard}>
                    <Text style={styles.loteTitle}>{lote.identificacao}</Text>
                    <Text style={styles.loteSub}>
                      Depósito: {lote.depositoDescricao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Localização: {lote.localizacao}
                    </Text>
                    <Text style={styles.loteSub}>
                      Validade: {lote.dataValidade}
                    </Text>
                    <View style={styles.loteRow}>
                      <Text style={styles.loteBadge}>
                        Qtd: {lote.quantidade}
                      </Text>
                      <Text style={styles.loteBadge}>Saldo: {lote.saldo}</Text>
                    </View>
                  </View>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingTop: 12, alignItems: "flex-start" },
  logo: { width: 80, height: 80 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 32,
  },
  searchContainer: {
    width: "100%",
    paddingHorizontal: 28,
    marginTop: 24,
    gap: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#a8d8ff",
    letterSpacing: 2,
    textAlign: "center",
  },
  list: {
    width: "100%",
    paddingHorizontal: 28,
    marginTop: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "#1a3a8a",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: {
    color: "#e0f0ff",
    fontSize: 15,
    fontWeight: "bold",
  },
  cardSub: {
    color: "#7a9aaa",
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: "#4a5a8a",
    textAlign: "center",
    marginTop: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#0d0d3b",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "75%",
    borderTopWidth: 1,
    borderColor: "#1a3a8a",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  modalTitle: {
    color: "#a8d8ff",
    fontSize: 16,
    fontWeight: "bold",
    flex: 1,
    marginRight: 8,
  },
  loteCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "#1a3a8a",
    borderRadius: 10,
    padding: 12,
    marginBottom: 10,
  },
  loteTitle: {
    color: "#e0f0ff",
    fontSize: 14,
    fontWeight: "bold",
    marginBottom: 4,
  },
  loteSub: {
    color: "#7a9aaa",
    fontSize: 12,
    marginTop: 2,
  },
  loteRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 8,
  },
  loteBadge: {
    color: "#7ec8ff",
    fontSize: 12,
    backgroundColor: "rgba(126,200,255,0.1)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
});
