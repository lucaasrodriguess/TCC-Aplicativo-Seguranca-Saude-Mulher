import { Ionicons } from "@expo/vector-icons";
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
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext";

export default function LoginScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false); // NOVO: Estado para visibilidade da senha

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      setErrorMessage("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setErrorMessage("");
    setIsLoading(true);
    try {
      await context.login(email, password);
      // O redirecionamento é tratado pelo _layout principal
    } catch (error: any) {
      if (
        [
          "auth/user-not-found",
          "auth/wrong-password",
          "auth/invalid-credential",
          "auth/invalid-email",
        ].includes(error.code)
      ) {
        setErrorMessage("E-mail ou senha incorretos.");
      } else {
        setErrorMessage("Ocorreu um erro inesperado. Tente novamente.");
        console.error("Erro de Login:", error);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setIsGoogleLoading(true);
    try {
      await context.signInWithGoogle();
    } catch (error: any) {
      setErrorMessage("Ocorreu um erro ao logar com o Google.");
      console.error("Erro de Login com Google:", error);
    } finally {
      setIsGoogleLoading(false);
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
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Bem-vinda de volta!</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>
          </View>

          {/* Input de Email */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="mail-outline"
              size={22}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="E-mail"
              placeholderTextColor="#888"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              onFocus={() => setErrorMessage("")}
            />
          </View>

          {/* Input de Senha com Ícone */}
          <View style={styles.inputContainer}>
            <Ionicons
              name="lock-closed-outline"
              size={22}
              color="#888"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              placeholder="Senha"
              placeholderTextColor="#888"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!isPasswordVisible} // ALTERADO: Controlado pelo estado
              onFocus={() => setErrorMessage("")}
            />
            <TouchableOpacity
              onPress={() => setIsPasswordVisible(!isPasswordVisible)}
              style={styles.eyeIcon}
            >
              <Ionicons
                name={isPasswordVisible ? "eye-off-outline" : "eye-outline"}
                size={22}
                color="#888"
              />
            </TouchableOpacity>
          </View>

          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.mainButtonText}>Entrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={handleGoogleLogin}
            disabled={isGoogleLoading}
          >
            {isGoogleLoading ? (
              <ActivityIndicator color="#333" />
            ) : (
              <>
                <Image
                  source={require("@/assets/images/google-logo.png")}
                  style={styles.googleLogo}
                />
                <Text style={styles.secondaryButtonText}>
                  Entrar com Google
                </Text>
              </>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity
              onPress={() => router.push("/(auth)/RegisterScreen")}
            >
              <Text style={styles.linkText}>Crie uma agora</Text>
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
    paddingVertical: 20,
    justifyContent: "center",
  },
  headerContainer: { alignItems: "center", marginBottom: 30 },
  logo: { width: 80, height: 80, resizeMode: "contain", marginBottom: 15 },
  title: { fontSize: 28, fontWeight: "bold", color: "#333" },
  subtitle: { fontSize: 16, color: "#888", marginTop: 8 },

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
  input: {
    flex: 1,
    paddingVertical: 18,
    fontSize: 16,
    color: "#333",
  },
  eyeIcon: { paddingHorizontal: 15 },

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
    marginTop: 10,
  },
  mainButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },

  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 25,
  },
  line: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  separatorText: { marginHorizontal: 10, color: "#888" },

  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
    padding: 18,
    borderRadius: 16,
    marginBottom: 10,
  },
  googleLogo: { width: 22, height: 22, marginRight: 12 },
  secondaryButtonText: { color: "#333", fontWeight: "bold", fontSize: 16 },

  footerContainer: {
    flexDirection: "row",
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  footerText: { fontSize: 14, color: "#555" },
  linkText: { color: "#FF6B6B", fontWeight: "bold", fontSize: 14 },
});
