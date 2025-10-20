import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import CustomInput from "../../components/CustomInput";
import { UserContext, UserContextType } from "../../contexts/UserContext";

const PasswordStrengthIndicator = ({ password }: { password: string }) => {
  const hasMinLength = password.length >= 6;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const Requirement = ({ met, text }: { met: boolean; text: string }) => (
    <View style={styles.requirementRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "close-circle"}
        size={16}
        color={met ? "#10B981" : "#EF4444"}
      />
      <Text
        style={[styles.requirementText, { color: met ? "#10B981" : "#6B7280" }]}
      >
        {text}
      </Text>
    </View>
  );

  return (
    <View style={styles.passwordRequirementsContainer}>
      <Requirement met={hasMinLength} text="Pelo menos 6 caracteres" />
      <Requirement met={hasUpperCase} text="Uma letra maiúscula" />
      <Requirement met={hasSpecialChar} text="Um caractere especial (!@#...)" />
    </View>
  );
};

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);

  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const context = useContext(UserContext) as UserContextType;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (!fullName || !email || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem!");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);
    try {
      await context.register(fullName, email, password, imageUri);
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Este e-mail já está sendo utilizado.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("A senha é muito fraca. Siga os requisitos.");
      } else {
        setErrorMessage("Ocorreu um erro ao criar a conta.");
        console.error(error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <Ionicons name="chevron-back" size={28} color="#333" />
          </TouchableOpacity>

          <View style={styles.headerContainer}>
            <Text style={styles.title}>Crie sua Conta</Text>
            <Text style={styles.subtitle}>
              Junte-se à nossa comunidade de apoio
            </Text>
          </View>

          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera-outline" size={30} color="#003249" />
              </View>
            )}
            <View style={styles.editIconContainer}>
              <Ionicons name="add" size={18} color="#fff" />
            </View>
          </TouchableOpacity>

          {/* Inputs Atualizados */}
          <CustomInput
            icon="person-outline"
            placeholder="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
            autoCapitalize="words"
          />
          <CustomInput
            icon="mail-outline"
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <CustomInput
            icon="lock-closed-outline"
            placeholder="Crie uma senha"
            value={password}
            onChangeText={setPassword}
            isPassword={true}
            secureTextEntry={!isPasswordVisible}
            onToggleVisibility={() => setIsPasswordVisible(!isPasswordVisible)}
          />
          <CustomInput
            icon="lock-closed-outline"
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword={true}
            secureTextEntry={!isConfirmPasswordVisible}
            onToggleVisibility={() =>
              setIsConfirmPasswordVisible(!isConfirmPasswordVisible)
            }
          />

          {password.length > 0 && (
            <PasswordStrengthIndicator password={password} />
          )}

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleRegister}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainButtonText}>Criar Conta</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/LoginScreen")}
            >
              <Text style={styles.linkText}>Faça Login</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  content: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingBottom: 20,
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    top: 20,
    left: 20,
    zIndex: 10,
    padding: 5,
  },
  headerContainer: { alignItems: "center", marginBottom: 20, marginTop: 60 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 16, color: "#888", marginTop: 8, textAlign: "center" },
  imagePickerContainer: {
    alignSelf: "center",
    marginBottom: 20,
    position: "relative",
  },
  profileImage: { width: 100, height: 100, borderRadius: 50 },
  placeholderContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#003249",
    padding: 6,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#fff",
  },
  passwordRequirementsContainer: {
    marginBottom: 10,
    paddingHorizontal: 10,
  },
  requirementRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  requirementText: {
    marginLeft: 8,
    fontSize: 13,
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    height: 20,
  },
  errorSpacer: { height: 20, marginBottom: 10 },
  mainButton: {
    backgroundColor: "#003249",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  mainButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footerContainer: {
    flexDirection: "row",
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: { fontSize: 14, color: "#555" },
  linkText: { color: "#FF6B6B", fontWeight: "bold", fontSize: 14 },
});
