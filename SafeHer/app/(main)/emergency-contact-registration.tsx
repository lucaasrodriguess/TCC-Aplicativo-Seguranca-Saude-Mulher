import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { addDoc, collection } from "firebase/firestore";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext";
import { db } from "../../services/firebaseConfig";

// --- COMPONENTE DE CABEÇALHO SIMPLES COM BOTÃO DE VOLTAR ---
const Header = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Adicionar Contato</Text>
        <View style={styles.headerIcon} />
      </View>
    </SafeAreaView>
  );
};

// --- TELA PRINCIPAL ---
export default function EmergencyContactRegistration() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { user } = useContext(UserContext) as UserContextType;

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const saveContact = async () => {
    if (!user) {
      Alert.alert("Erro", "Você precisa estar logado para adicionar contatos.");
      return;
    }

    const cleanedPhone = phone.replace(/\D/g, "");
    if (!name.trim() || !cleanedPhone) {
      Alert.alert("Campos Vazios", "Por favor, preencha o nome e o telefone.");
      return;
    }
    if (cleanedPhone.length < 10) {
      Alert.alert(
        "Telefone Inválido",
        "Digite um número de telefone válido com DDD."
      );
      return;
    }

    setIsLoading(true);
    try {
      const contactsCollectionRef = collection(
        db,
        "users",
        user.uid,
        "emergency_contacts"
      );
      await addDoc(contactsCollectionRef, { name: name.trim(), phone });

      Alert.alert("Sucesso!", "O contato de emergência foi salvo.", [
        { text: "OK", onPress: () => router.back() },
      ]);
    } catch (error) {
      console.error("Erro ao salvar contato no Firebase:", error);
      Alert.alert(
        "Erro",
        "Não foi possível salvar o contato. Tente novamente."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <KeyboardAvoidingView
        style={styles.formContainer}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <Text style={styles.pageSubtitle}>
          Adicione uma pessoa de confiança para ser contatada em caso de
          emergência.
        </Text>

        <View style={styles.inputContainer}>
          <Ionicons
            name="person-outline"
            size={22}
            color="#888"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="Nome Completo"
            placeholderTextColor="#888"
            style={styles.input}
            value={name}
            onChangeText={setName}
            editable={!isLoading}
          />
        </View>

        <View style={styles.inputContainer}>
          <Ionicons
            name="call-outline"
            size={22}
            color="#888"
            style={styles.inputIcon}
          />
          <TextInput
            placeholder="(99) 99999-9999"
            placeholderTextColor="#888"
            style={styles.input}
            keyboardType="phone-pad"
            value={phone}
            onChangeText={(text) => setPhone(formatPhone(text))}
            maxLength={15}
            editable={!isLoading}
          />
        </View>

        <TouchableOpacity
          style={[styles.saveButton, isLoading && styles.buttonDisabled]}
          onPress={saveContact}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="save-outline" size={22} color="#fff" />
              <Text style={styles.saveButtonText}>Salvar Contato</Text>
            </>
          )}
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  safeArea: {
    backgroundColor: "#003249",
  },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerIcon: {
    padding: 10,
    width: 50, // Garante espaço para o título ficar centralizado
  },
  formContainer: {
    flex: 1,
    padding: 20,
    paddingTop: 30,
  },
  pageSubtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: 24,
  },
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
  inputIcon: {
    paddingHorizontal: 15,
  },
  input: {
    flex: 1,
    paddingVertical: 18,
    paddingRight: 18,
    fontSize: 16,
    color: "#333",
  },
  saveButton: {
    backgroundColor: "#003249",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
    marginTop: 20,
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
  },
  buttonDisabled: {
    backgroundColor: "#a9a9a9",
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
