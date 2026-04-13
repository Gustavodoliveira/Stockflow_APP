import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from "react-native";

type ButtonProps = TouchableOpacityProps & {
  title: string;
  loading?: boolean;
  icon?: React.ComponentProps<typeof Ionicons>["name"];
  variant?: "primary" | "outline";
};

export function Button({
  title,
  loading = false,
  icon,
  variant = "primary",
  style,
  disabled,
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading;

  if (variant === "outline") {
    return (
      <TouchableOpacity
        style={[styles.outlineButton, isDisabled && styles.disabled, style]}
        activeOpacity={0.8}
        disabled={isDisabled}
        {...props}
      >
        {loading ? (
          <ActivityIndicator color="#7ec8ff" size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={18}
                color="#7ec8ff"
                style={styles.icon}
              />
            )}
            <Text style={styles.outlineText}>{title}</Text>
          </>
        )}
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.button, isDisabled && styles.disabled, style]}
      activeOpacity={0.8}
      disabled={isDisabled}
      {...props}
    >
      <LinearGradient
        colors={["#1a4aaa", "#5a2aaa", "#1a3a8a"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.gradient}
      >
        {loading ? (
          <ActivityIndicator color="#e0f0ff" size="small" />
        ) : (
          <>
            {icon && (
              <Ionicons
                name={icon}
                size={18}
                color="#e0f0ff"
                style={styles.icon}
              />
            )}
            <Text style={styles.text}>{title}</Text>
          </>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

export default Button;

const styles = StyleSheet.create({
  button: {
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#5a2aaa",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 8,
  },
  gradient: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
  },
  text: {
    color: "#e0f0ff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  outlineButton: {
    height: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "#1a3a8a",
    paddingHorizontal: 20,
  },
  outlineText: {
    color: "#7ec8ff",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 1.5,
  },
  icon: {
    marginRight: 8,
  },
  disabled: {
    opacity: 0.5,
  },
});
