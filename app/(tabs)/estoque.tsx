import Input from "@/components/input";
import { getProdutos, Produto } from "@/services/StockApi";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EstoqueScreen() {
  const [query, setQuery] = useState("");
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch(text: string) {
    setQuery(text);
    if (text.trim().length < 2) {
      setProdutos([]);
      return;
    }
    setLoading(true);
    try {
      const result = await getProdutos(text.trim());
      setProdutos(result);
    } catch {
      setProdutos([]);
    } finally {
      setLoading(false);
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
          </View>

          {loading && (
            <ActivityIndicator color="#7ec8ff" style={{ marginTop: 24 }} />
          )}

          <FlatList
            data={produtos}
            keyExtractor={(item) => String(item.id)}
            style={styles.list}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>{item.descricao}</Text>
                <Text style={styles.cardSub}>
                  {item.identificacao} · {item.unidadeMedida}
                </Text>
                <Text style={styles.cardSub}>
                  Localização: {item.localizacao}
                </Text>
                <Text style={styles.cardPrice}>
                  Venda: R$ {item.valorVenda.toFixed(2)}
                </Text>
              </View>
            )}
            ListEmptyComponent={
              !loading && query.length >= 2 ? (
                <Text style={styles.empty}>Nenhum produto encontrado.</Text>
              ) : null
            }
          />
        </View>
      </SafeAreaView>
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
  cardPrice: {
    color: "#7ec8ff",
    fontSize: 13,
    marginTop: 6,
  },
  empty: {
    color: "#4a5a8a",
    textAlign: "center",
    marginTop: 32,
  },
});
