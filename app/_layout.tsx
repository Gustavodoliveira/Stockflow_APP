import { clearAuth, getToken, isTokenExpired } from "@/services/auth";
import { Slot, useRouter, useSegments } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";

function AuthGuard() {
  const router = useRouter();
  const segments = useSegments();
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    let isMounted = true;
    async function check() {
      const token = await getToken();
      const inLogin = segments[1] === "login";

      if (!token || isTokenExpired(token)) {
        await clearAuth();
        if (!inLogin) router.replace("/(tabs)/login");
        if (isMounted) setChecked(true);
        return;
      }
      if (token && inLogin) {
        router.replace("/(tabs)");
      }
      if (isMounted) setChecked(true);
    }
    check();
    return () => {
      isMounted = false;
    };
  }, [segments]);

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
