import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext";

const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={22} color="#8e8e93" style={styles.infoIcon} />
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  </View>
);

export default function ProfileScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  if (!context || !context.user) {
    // Idealmente, redirecionaria para o login se não houver usuário
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text>Usuário não encontrado. Por favor, faça login novamente.</Text>
      </SafeAreaView>
    );
  }

  const { user, logout } = context;

  const handleLogout = () => {
    Alert.alert("Sair da Conta", "Você tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: () => {
          logout();
          // Navega para a tela de login (assumindo que está na raiz)
          router.replace("/LoginScreen");
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="close-circle" size={32} color="#e5e7eb" />
          </Pressable>
        </View>

        <View style={styles.profileHeader}>
          <Image source={{ uri: user.avatar }} style={styles.avatar} />
          <Text style={styles.name}>{user.name}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Detalhes da Conta</Text>
          <InfoRow
            icon="person-outline"
            label="Nome Completo"
            value={user.name}
          />
          <InfoRow icon="mail-outline" label="Email" value={user.email} />
          <InfoRow icon="call-outline" label="Telefone" value={user.phone} />
        </View>

        <Pressable
          style={styles.editButton}
          onPress={() => router.push("./edit-profile")}
        >
          <Ionicons name="pencil-outline" size={20} color="#fff" />
          <Text style={styles.editButtonText}>Editar Perfil</Text>
        </Pressable>

        <Pressable style={styles.logoutButton} onPress={handleLogout}>
          <Ionicons name="log-out-outline" size={22} color="#9C6ADE" />
          <Text style={styles.logoutButtonText}>Sair</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: "#f9fafb" },
  container: { paddingBottom: 40 },
  header: { alignItems: "flex-end", padding: 16 },
  backButton: { padding: 5 },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 10,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 16,
    color: "#1f2937",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    marginHorizontal: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 15,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  infoIcon: {
    marginRight: 20,
  },
  infoLabel: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 2,
  },
  infoValue: {
    color: "#1f2937",
    fontSize: 16,
    fontWeight: "500",
  },
  editButton: {
    flexDirection: "row",
    backgroundColor: "#9C6ADE",
    paddingVertical: 16,
    borderRadius: 99,
    margin: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    shadowColor: "#9C6ADE",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  editButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  logoutButton: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 16,
    borderRadius: 99,
    marginHorizontal: 20,
    marginBottom: 20,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  logoutButtonText: {
    color: "#9C6ADE",
    fontSize: 16,
    fontWeight: "bold",
  },
});
