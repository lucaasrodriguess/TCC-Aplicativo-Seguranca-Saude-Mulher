import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// 👈 NOVO: Importa o componente de input padronizado
import CustomInput from "../../components/CustomInput";
import { UserContext, UserContextType } from "../../contexts/UserContext";

// --- COMPONENTE DE CABEÇALHO ---
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
        <Text style={styles.headerTitle}>Editar Perfil</Text>
        <View style={styles.headerIcon} />
      </View>
    </SafeAreaView>
  );
};

// --- TELA PRINCIPAL ---
export default function EditProfileScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  if (!context || !context.user) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

  const { user, updateUser } = context;

  const [avatarUri, setAvatarUri] = useState(user.avatar);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone || "");
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão necessária",
        "Precisamos de acesso às suas fotos para continuar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const handleSaveChanges = async () => {
    if (!name.trim()) {
      Alert.alert("Campo Vazio", "Por favor, preencha seu nome.");
      return;
    }
    setIsLoading(true);
    try {
      // Cria um objeto apenas com os dados que serão enviados para a função updateUser
      const updatedData: Partial<{
        name: string;
        phone: string;
        avatar: string;
      }> = {
        name,
        phone,
      };

      // Adiciona o avatar ao objeto apenas se ele foi realmente alterado
      if (avatarUri !== user.avatar) {
        updatedData.avatar = avatarUri;
      }

      await updateUser(updatedData);

      Alert.alert("Sucesso!", "Seu perfil foi atualizado.");
      router.back();
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      Alert.alert(
        "Erro",
        "Não foi possível atualizar seu perfil. Tente novamente."
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
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.avatarSection}>
            <Image source={{ uri: avatarUri }} style={styles.avatar} />
            <TouchableOpacity
              style={styles.editIconContainer}
              onPress={pickImage}
            >
              <Ionicons name="camera-reverse-outline" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <View style={styles.form}>
            {/* 👇 INPUTS ATUALIZADOS */}
            <CustomInput
              icon="person-outline"
              placeholder="Nome Completo"
              value={name}
              onChangeText={setName}
            />
            <CustomInput
              icon="call-outline"
              placeholder="(99) 99999-9999"
              value={phone}
              onChangeText={(text) => setPhone(formatPhone(text))}
              keyboardType="phone-pad"
            />

            <View
              style={[styles.inputContainer, styles.inputDisabledContainer]}
            >
              <Ionicons
                name="mail-outline"
                size={22}
                color="#888"
                style={styles.inputIcon}
              />
              <Text style={[styles.input, styles.inputDisabled]}>
                {user.email}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, isLoading && styles.buttonDisabled]}
            onPress={handleSaveChanges}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <>
                <Ionicons name="save-outline" size={22} color="#fff" />
                <Text style={styles.saveButtonText}>Salvar Alterações</Text>
              </>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#FAF9F6" },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  safeArea: { backgroundColor: "#003249" },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerIcon: { padding: 10, width: 50 },
  scrollContainer: { padding: 20 },
  avatarSection: {
    alignItems: "center",
    marginVertical: 20,
    position: "relative",
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  editIconContainer: {
    position: "absolute",
    bottom: 0,
    right: "30%",
    backgroundColor: "#003249",
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "#fff",
  },
  form: { marginBottom: 30 },
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
  inputDisabledContainer: {
    backgroundColor: "#f0f0f0",
  },
  inputDisabled: {
    color: "#888",
  },
  saveButton: {
    backgroundColor: "#003249",
    padding: 18,
    borderRadius: 16,
    alignItems: "center",
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
