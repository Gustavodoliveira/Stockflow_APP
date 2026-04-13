import Input from "@/components/input";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function LoginScreen() {
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
          <Text style={styles.title}>Bem Vindo</Text>
          <Text style={styles.subtitle}>Acesse sua conta para continuar</Text>

          <View style={styles.form}>
            <Input
              placeholder="E-mail"
              keyboardType="email-address"
              autoCapitalize="none"
              icon={<Ionicons name="mail-outline" size={18} color="#4a6aaa" />}
            />

            <Input
              placeholder="Senha"
              secureTextEntry
              icon={
                <Ionicons
                  name="lock-closed-outline"
                  size={18}
                  color="#4a6aaa"
                />
              }
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.button} activeOpacity={0.8}>
              <LinearGradient
                colors={["#1a4aaa", "#5a2aaa", "#1a3a8a"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.buttonGradient}
              >
                <Text style={styles.buttonText}>Entrar</Text>
              </LinearGradient>
            </TouchableOpacity>
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
    alignItems: "flex-start",
  },
  logo: { width: 80, height: 80 },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingBottom: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#a8d8ff",
    letterSpacing: 3,
    textAlign: "center",
    textShadowColor: "#7ec8ff",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#5a7aaa",
    marginTop: 6,
    marginBottom: 36,
    letterSpacing: 1,
  },
  form: {
    width: "100%",
    gap: 14,
  },
  forgotPassword: {
    alignSelf: "flex-end",
    marginTop: -4,
  },
  forgotPasswordText: {
    fontSize: 13,
    color: "#7ec8ff",
    letterSpacing: 0.5,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#5a2aaa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  buttonGradient: {
    height: 50,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonText: {
    color: "#e0f0ff",
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 2,
  },
});
