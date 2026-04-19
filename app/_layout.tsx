import { getToken } from "@/services/auth";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    async function check() {
      const token = await getToken();
      const inLogin = segments[1] === "login";

      if (!token && !inLogin) {
        router.replace("/(tabs)/login");
      } else if (token && inLogin) {
        router.replace("/(tabs)");
      }

      setChecked(true);
    }

    check();
  }, []);

  if (!checked) return null;

  return <Slot />;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <View style={styles.root}>
        <AuthGuard />
      </View>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#0a0a1a",
  },
});
