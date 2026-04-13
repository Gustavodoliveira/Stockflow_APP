import Input from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function EstoqueScreen() {
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
              icon={
                <Ionicons name="search-outline" size={18} color="#4a6aaa" />
              }
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
});
