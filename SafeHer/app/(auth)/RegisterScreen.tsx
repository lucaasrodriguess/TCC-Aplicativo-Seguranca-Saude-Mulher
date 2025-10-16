import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Image, // Importar Platform para ajustes específicos do iOS
  KeyboardAvoidingView,
  Platform,
  SafeAreaView, // NOVO
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext";

export default function RegisterScreen() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  const router = useRouter();
  const context = useContext(UserContext) as UserContextType;

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled) {
      setImageUri(result.assets[0].uri);
    }
  };

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      setErrorMessage("As senhas não coincidem!");
      return;
    }
    if (!fullName || !email || !password) {
      setErrorMessage("Por favor, preencha todos os campos.");
      return;
    }
    setErrorMessage("");

    try {
      await context.register(fullName, email, password, imageUri);
      router.replace("../(main)/(tabs)");
    } catch (error: any) {
      if (error.code === "auth/email-already-in-use") {
        setErrorMessage("Este email já está a ser utilizado.");
      } else if (error.code === "auth/weak-password") {
        setErrorMessage("A senha deve ter pelo menos 6 caracteres.");
      } else {
        setErrorMessage("Ocorreu um erro ao criar a conta.");
        console.error(error);
      }
    }
  };

  const handleSignInPress = () => {
    router.push("/LoginScreen");
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* NOVO: KeyboardAvoidingView para mover o conteúdo
        'behavior' é necessário, e 'padding' ou 'position' são comuns.
        'padding' funciona melhor com ScrollView
      */}
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* NOVO: ScrollView para permitir rolagem quando o teclado estiver aberto */}
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled" // Garante que o toque não feche o teclado imediatamente
        >
          <Image
            source={require("../../assets/images/logo.png")}
            style={styles.logo}
          />
          <Text style={styles.title}>Bem-vinda!</Text>
          <Text style={styles.subtitle}>
            Cuidar da sua saúde e garantir sua segurança é o que nos move.
          </Text>

          <TouchableOpacity
            style={styles.imagePickerContainer}
            onPress={handlePickImage}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.profileImage} />
            ) : (
              <View style={styles.placeholderContainer}>
                <Ionicons name="camera" size={30} color="#9C6ADE" />
                <Text style={styles.placeholderText}>Adicionar Foto</Text>
              </View>
            )}
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            placeholder="Nome Completo"
            value={fullName}
            onChangeText={setFullName}
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="E-mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Insira sua senha"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            returnKeyType="next"
          />
          <TextInput
            style={styles.input}
            placeholder="Confirme sua senha"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            returnKeyType="done"
          />

          {errorMessage ? (
            <Text style={styles.errorMessage}>{errorMessage}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.button}
            onPress={handleRegister}
            disabled={context.isLoading}
          >
            {context.isLoading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={styles.buttonText}>Registrar</Text>
            )}
          </TouchableOpacity>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>Já tem uma conta? </Text>
            <TouchableOpacity onPress={handleSignInPress}>
              <Text style={styles.signIn}>Sign In</Text>
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
    // Removido justifyContent: "center" do container principal
  },
  // NOVO: Estilo para o KeyboardAvoidingView ocupar todo o espaço
  keyboardContainer: {
    flex: 1,
  },
  // ALTERADO: content agora é o contentContainerStyle do ScrollView
  content: {
    flexGrow: 1, // Permite que o conteúdo cresça e centralize
    alignItems: "center",
    paddingHorizontal: 30,
    paddingVertical: 20, // Adicionado padding vertical para telas pequenas
    justifyContent: "center", // Mantém o conteúdo centralizado se houver espaço
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    marginBottom: 15,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
    paddingHorizontal: 10,
  },
  imagePickerContainer: {
    marginBottom: 20,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
  },
  placeholderContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#FFF",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderStyle: "dashed",
  },
  placeholderText: {
    fontSize: 12,
    color: "#9C6ADE",
    marginTop: 5,
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
  errorMessage: {
    color: "red",
    fontSize: 14,
    marginBottom: 10,
    textAlign: "center",
    minHeight: 20,
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
  buttonText: {
    color: "#FFF",
    fontWeight: "bold",
    fontSize: 16,
  },
  footerContainer: {
    flexDirection: "row",
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20, // Adicionado para dar espaço na parte inferior
  },
  footerText: {
    fontSize: 14,
    color: "#555",
  },
  signIn: {
    color: "#9C6ADE",
    fontWeight: "bold",
    fontSize: 14,
  },
});
