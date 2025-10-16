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

  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      setErrorMessage("Por favor, preencha o e-mail e a senha.");
      return;
    }

    setErrorMessage("");
    setIsLoading(true);

    try {
      await context.login(email, password);
    } catch (error: any) {
      let customMessage = "E-mail ou senha incorretas";

      if (
        error.code === "auth/user-not-found" ||
        error.code === "auth/wrong-password" ||
        error.code === "auth/invalid-credential" ||
        error.code === "auth/invalid-email"
      ) {
        setErrorMessage(customMessage);
      } else {
        setErrorMessage("Ocorreu um erro inesperado ao tentar fazer login.");
        console.error("Erro de Login:", error);
      }

      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");
    setIsLoading(true);
    try {
      await context.signInWithGoogle();
    } catch (error: any) {
      setErrorMessage("Ocorreu um erro ao logar com o Google.");
      console.error("Erro de Login com Google:", error);
      return;
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegisterPress = () => {
    router.push("/(auth)/RegisterScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
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
          </View>

          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            onFocus={() => setErrorMessage("")}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setErrorMessage("")}
            returnKeyType="done"
          />

          {errorMessage ? (
            <Text style={styles.inlineErrorText}>{errorMessage}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}

          <TouchableOpacity>
            <Text style={styles.forgotPasswordText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Login</Text>
            )}
          </TouchableOpacity>

          <View style={styles.separatorContainer}>
            <View style={styles.line} />
            <Text style={styles.separatorText}>ou</Text>
            <View style={styles.line} />
          </View>

          <TouchableOpacity
            style={styles.googleButton}
            onPress={handleGoogleLogin}
            disabled={isLoading}
          >
            <Image
              source={require("@/assets/images/google-logo.png")}
              style={styles.googleLogo}
            />
            <Text style={styles.googleButtonText}>Entrar com Google</Text>
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Não tem uma conta? </Text>
            <TouchableOpacity onPress={handleRegisterPress}>
              <Text style={styles.createAccountLink}>Criar conta</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F8F8",
  },
  keyboardContainer: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20,
    justifyContent: "center",
  },
  headerContainer: { alignItems: "center", marginBottom: 40 },
  logo: { width: 100, height: 100, resizeMode: "contain", marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
  },
  input: {
    width: "100%",
    height: 50,
    backgroundColor: "#FFF",
    borderRadius: 12,
    paddingHorizontal: 20,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    fontSize: 16,
  },
  // ESTILO DO ERRO INLINE
  inlineErrorText: {
    width: "100%",
    color: "#C81E1E", // Cor vermelha de erro
    fontSize: 14,
    fontWeight: "600",
    textAlign: "left", // Alinhado à esquerda
    marginBottom: 5, // Espaço menor antes do link "Esqueci minha senha"
  },
  // ESPAÇADOR PARA MANTER O LAYOUT
  errorSpacer: {
    height: 14 + 5,
  },
  forgotPasswordText: {
    color: "#9C6ADE",
    fontSize: 14,
    textAlign: "right",
    width: "100%",
    marginBottom: 15,
    fontWeight: "500",
  },
  button: {
    width: "100%",
    height: 50,
    backgroundColor: "#9C6ADE",
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    shadowColor: "#9C6ADE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  buttonText: { color: "#FFF", fontWeight: "bold", fontSize: 16 },
  footerContainer: {
    flexDirection: "row",
    marginTop: 30,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  footerText: { fontSize: 14, color: "#555" },
  createAccountLink: { color: "#9C6ADE", fontWeight: "bold", fontSize: 14 },
  separatorContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    marginVertical: 20,
  },
  line: { flex: 1, height: 1, backgroundColor: "#e0e0e0" },
  separatorText: { marginHorizontal: 10, color: "#888" },
  googleButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e0e0e0",
    width: "100%",
    height: 50,
    borderRadius: 25,
    marginBottom: 10,
  },
  googleLogo: { width: 24, height: 24, marginRight: 10 },
  googleButtonText: { color: "#333", fontWeight: "bold", fontSize: 16 },
});
