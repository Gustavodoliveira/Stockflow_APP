import Button from "@/components/button";
import Input from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect, useRouter } from "expo-router";
import { useCallback, useState } from "react";
import {
  Image,
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
};

export default function ProducaoScreen() {
  const router = useRouter();
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);
  const [ordens, setOrdens] = useState<OrdemResumo[]>([]);

  useFocusEffect(
    useCallback(() => {
      AsyncStorage.getItem("@orders").then((raw) => {
        setOrdens(raw ? JSON.parse(raw) : []);
      });
    }, []),
  );

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
                <TouchableOpacity
                  key={ordem.id}
                  style={styles.ordemCard}
                  activeOpacity={0.75}
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
                      {ordem.insumos.length} insumo(s) · 
                      {ordem.produtosFinal.length} produto(s) final
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color="#7ec8ff" />
                </TouchableOpacity>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(126,200,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(126,200,255,0.2)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  ordemCardLeft: { gap: 4 },
  ordemCardDate: { color: "#d9ecff", fontSize: 13, fontWeight: "600" },
  ordemCardInfo: { color: "#7ec8ff", fontSize: 12 },
});
