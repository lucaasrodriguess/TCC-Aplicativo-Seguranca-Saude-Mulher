import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

type CustomInputProps = {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  isPassword?: boolean;
  onToggleVisibility?: () => void;
  keyboardType?: "default" | "email-address" | "numeric" | "phone-pad";
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
};

export default function CustomInput({
  icon,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  isPassword = false,
  onToggleVisibility,
  keyboardType = "default",
  autoCapitalize = "sentences",
}: CustomInputProps) {
  return (
    <View style={styles.inputContainer}>
      <Ionicons name={icon} size={22} color="#888" style={styles.inputIcon} />
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
      />
      {isPassword && (
        <TouchableOpacity onPress={onToggleVisibility} style={styles.eyeIcon}>
          <Ionicons
            name={secureTextEntry ? "eye-off-outline" : "eye-outline"}
            size={22}
            color="#888"
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 15,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  inputIcon: { paddingHorizontal: 15 },
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: "#333" },
  eyeIcon: { paddingHorizontal: 15 },
});
