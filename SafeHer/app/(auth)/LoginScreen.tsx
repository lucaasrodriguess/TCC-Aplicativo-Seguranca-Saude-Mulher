import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Modal, // Importado
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

// Importe o 'auth' do seu arquivo de configuração do Firebase
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../../services/firebaseConfig";

// --- NOVO MODAL GENÉRICO ---
const InfoModal = ({
  visible,
  onClose,
  title,
  message,
  buttonText,
  icon,
  iconColor,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  buttonText: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
}) => (
  <Modal
    animationType="fade"
    transparent={true}
    visible={visible}
    onRequestClose={onClose}
  >
    <View style={modalStyles.centeredView}>
      <View style={modalStyles.modalView}>
        <View style={modalStyles.iconContainer}>
          <Ionicons name={icon} size={50} color={iconColor} />
        </View>
        <Text style={modalStyles.modalTitle}>{title}</Text>
        <Text style={modalStyles.modalText}>{message}</Text>
        <TouchableOpacity style={modalStyles.modalButton} onPress={onClose}>
          <Text style={modalStyles.modalButtonText}>{buttonText}</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default function LoginScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isButtonLoading, setIsButtonLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  // --- NOVOS ESTADOS DOS MODAIS ---
  const [showResetModal, setShowResetModal] = useState(false);
  const [showNotVerifiedModal, setShowNotVerifiedModal] = useState(false);

  // --- FUNÇÃO DE LOGIN ATUALIZADA ---
  const handleLogin = async () => {
    if (email.trim() === "" || password.trim() === "") {
      setErrorMessage("Por favor, preencha o e-mail e a senha.");
      return;
    }
    setErrorMessage("");
    setIsButtonLoading(true);
    try {
      await context.login(email, password);
      // Sucesso: O listener onAuthStateChanged cuidará da navegação
    } catch (error: any) {
      if (error.message === "auth/email-not-verified") {
        // Mostra o modal de e-mail não verificado
        setShowNotVerifiedModal(true);
      } else if (
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
      setIsButtonLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    // ... (Sem alterações)
    setIsGoogleLoading(true);
    try {
      await context.signInWithGoogle();
    } catch (error) {
      console.error("Erro no login com Google:", error);
      setErrorMessage("Não foi possível fazer login com o Google.");
      setIsGoogleLoading(false);
    }
  };

  // --- FUNÇÃO DE RESET ATUALIZADA ---
  const handlePasswordReset = async () => {
    if (email.trim() === "") {
      setErrorMessage("Digite seu e-mail no campo acima para redefinir a senha.");
      return;
    }
    setErrorMessage("");
    setIsButtonLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      // Mostra o modal de sucesso
      setShowResetModal(true);
    } catch (error: any) {
      if (error.code === "auth/user-not-found") {
        setErrorMessage("Nenhum usuário encontrado com este e-mail.");
      } else {
        setErrorMessage("Erro ao enviar e-mail de redefinição.");
      }
      console.error("Erro reset senha:", error);
    } finally {
      setIsButtonLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* --- RENDERIZA OS MODAIS --- */}
      <InfoModal
        visible={showResetModal}
        onClose={() => setShowResetModal(false)}
        title="Verifique seu E-mail"
        message="Enviamos um link para redefinição de senha para o seu e-mail."
        buttonText="OK"
        icon="mail"
        iconColor="#007AFF" // Azul
      />
      <InfoModal
        visible={showNotVerifiedModal}
        onClose={() => setShowNotVerifiedModal(false)}
        title="E-mail Não Verificado"
        message="Sua conta foi criada, mas seu e-mail ainda não foi verificado. Por favor, cheque sua caixa de entrada."
        buttonText="Entendi"
        icon="alert-circle"
        iconColor="#FF9500" // Laranja
      />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ... Restante do seu JSX ... */}
          {/* (headerContainer, inputs, botões...) */}
          <View style={styles.headerContainer}>
            <Image
              source={require("@/assets/images/logo.png")}
              style={styles.logo}
            />
            <Text style={styles.title}>Bem-vinda de volta!</Text>
            <Text style={styles.subtitle}>Faça login para continuar</Text>
          </View>
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
              secureTextEntry={!isPasswordVisible}
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
          <TouchableOpacity
            style={styles.forgotPasswordButton}
            onPress={handlePasswordReset}
            disabled={isButtonLoading}
          >
            <Text style={styles.forgotPasswordText}>Esqueceu a senha?</Text>
          </TouchableOpacity>
          {errorMessage ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : (
            <View style={styles.errorSpacer} />
          )}
          <TouchableOpacity
            style={styles.mainButton}
            onPress={handleLogin}
            disabled={isButtonLoading}
          >
            {isButtonLoading ? (
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

// Estilos da Tela (sem alterações)
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
  input: { flex: 1, paddingVertical: 18, fontSize: 16, color: "#333" },
  eyeIcon: { paddingHorizontal: 15 },
  forgotPasswordButton: {
    alignSelf: "flex-end",
  },
  forgotPasswordText: {
    color: "#003249",
    fontSize: 14,
    fontWeight: "600",
  },
  errorText: {
    color: "#FF6B6B",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 10,
    marginTop: 10,
    height: 20,
  },
  errorSpacer: { height: 20, marginBottom: 10, marginTop: 10 },
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

// --- ESTILOS DO MODAL (compartilhado com o de cima) ---
const modalStyles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  modalView: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 25,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    width: "90%",
  },
  iconContainer: {
    marginBottom: 15,
  },
  modalTitle: {
    marginBottom: 10,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  modalText: {
    marginBottom: 20,
    textAlign: "center",
    fontSize: 15,
    color: "#555",
    lineHeight: 22,
  },
  modalButton: {
    backgroundColor: "#003249",
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 30,
    elevation: 2,
    width: "100%",
  },
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    textAlign: "center",
    fontSize: 16,
  },
});