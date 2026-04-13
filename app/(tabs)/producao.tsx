import Button from "@/components/button";
import Input from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import {
  Image,
  Platform,
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

export default function ProducaoScreen() {
  const [date, setDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

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
        <View style={styles.content}>
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
              onPress={() => {}}
            />
          </View>
        </View>
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
    alignItems: "center",
    justifyContent: "flex-start",
    paddingTop: 24,
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
});
