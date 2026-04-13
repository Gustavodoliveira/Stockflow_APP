import { StyleSheet, TextInput, TextInputProps, View } from "react-native";

type InputProps = TextInputProps & {
  icon?: React.ReactNode;
};

export function Input({ icon, style, ...props }: InputProps) {
  return (
    <View style={styles.container}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <TextInput
        style={[styles.input, icon ? styles.inputWithIcon : null, style]}
        placeholderTextColor="#4a5a8a"
        {...props}
      />
    </View>
  );
}

export default Input;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.07)",
    borderWidth: 1,
    borderColor: "#1a3a8a",
    borderRadius: 12,
    height: 50,
    paddingHorizontal: 14,
  },
  icon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: "#e0f0ff",
    fontSize: 15,
  },
  inputWithIcon: {
    paddingLeft: 0,
  },
});
