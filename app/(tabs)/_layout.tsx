import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";

type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];

function TabIcon({
  name,
  color,
  size,
}: {
  name: IoniconsName;
  color: string;
  size: number;
}) {
  return <Ionicons name={name} size={size} color={color} />;
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#0a0a1a",
          borderTopColor: "#1a3a8a",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: "#7ec8ff",
        tabBarInactiveTintColor: "#3a4a6a",
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="estoque"
        options={{
          title: "Estoque",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="cube-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="pedidos"
        options={{
          title: "Pedidos",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="receipt-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="producao"
        options={{
          title: "Produção",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="construct-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="login"
        options={{
          title: "Login",
          tabBarIcon: ({ color, size }) => (
            <TabIcon name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
