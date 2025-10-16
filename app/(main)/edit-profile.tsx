import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext";

export default function EditProfileScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  if (!context || !context.user) {
    return <Text>Carregando...</Text>;
  }

  // 1. Em vez de 'setUser', agora pegamos 'updateUser' do contexto
  const { user, updateUser } = context;

  const [avatar, setAvatar] = useState(user.avatar);
  const [name, setName] = useState(user.name);
  const [phone, setPhone] = useState(user.phone);
  const [email] = useState(user.email);

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
      quality: 1,
    });

    if (!result.canceled) {
      setAvatar(result.assets[0].uri);
    }
  };

  const handleSaveChanges = () => {
    // 2. Usamos a nova função 'updateUser' para salvar os dados
    updateUser({ name, phone, avatar });

    Alert.alert("Sucesso", "Seu perfil foi atualizado!");
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
          <Pressable onPress={() => router.back()}>
            <Ionicons name="close-circle" size={32} color="#e5e7eb" />
          </Pressable>
        </View>

        <View style={styles.avatarContainer}>
          <Image source={{ uri: avatar }} style={styles.avatar} />
          <Pressable onPress={pickImage}>
            <Text style={styles.changePhotoButton}>Alterar Foto</Text>
          </Pressable>
        </View>

        <View style={styles.form}>
          <Text style={styles.inputLabel}>Nome Completo</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.inputLabel}>Telefone</Text>
          <TextInput
            value={phone}
            onChangeText={setPhone}
            style={styles.input}
            keyboardType="phone-pad"
          />

          <Text style={styles.inputLabel}>Email (não editável)</Text>
          <TextInput
            value={email}
            style={[styles.input, styles.inputDisabled]}
            editable={false}
          />
        </View>

        <Pressable style={styles.saveButton} onPress={handleSaveChanges}>
          <Text style={styles.saveButtonText}>Salvar Alterações</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#fff" },
  container: { padding: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 24, fontWeight: "bold" },
  avatarContainer: { alignItems: "center", marginVertical: 20 },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    marginBottom: 10,
    borderWidth: 3,
    borderColor: "#f3f4f6",
  },
  changePhotoButton: {
    color: "#9C6ADE",
    fontWeight: "bold",
    fontSize: 16,
    padding: 5,
  },
  form: { marginBottom: 30 },
  inputLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 8,
    marginTop: 20,
  },
  input: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  inputDisabled: { backgroundColor: "#e5e7eb", color: "#6b7280" },
  saveButton: {
    backgroundColor: "#9C6ADE",
    paddingVertical: 18,
    borderRadius: 99,
    justifyContent: "center",
    alignItems: "center",
  },
  saveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
