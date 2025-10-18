import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useRouter } from "expo-router";
import React, { useContext } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DrawerActions } from "@react-navigation/native";
import { UserContext, UserContextType } from "../../contexts/UserContext";

// --- COMPONENTE DE CABEÇALHO PADRÃO ---
const Header = () => {
  const navigation = useNavigation();
  const { user } = useContext(UserContext) as UserContextType;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerIcon}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Meu Perfil</Text>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerIcon}
        >
          {user?.avatar && (
            <Image source={{ uri: user.avatar }} style={styles.avatarSmall} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- COMPONENTE PARA LINHA DE INFORMAÇÃO ---
const InfoRow = ({
  icon,
  label,
  value,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string | null;
}) => (
  <View style={styles.infoRow}>
    <Ionicons name={icon} size={22} color="#003249" style={styles.infoIcon} />
    <View>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value || "Não informado"}</Text>
    </View>
  </View>
);

// --- TELA PRINCIPAL ---
export default function ProfileScreen() {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();

  if (!context || context.isLoading) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

  if (!context.user) {
    // A lógica do _layout raiz já deve ter redirecionado, mas é uma segurança extra.
    return (
      <SafeAreaView style={styles.appContainer}>
        <Text style={{ textAlign: "center", marginTop: 50 }}>
          Usuário não encontrado.
        </Text>
      </SafeAreaView>
    );
  }

  const { user, logout } = context;

  const handleLogout = () => {
    Alert.alert("Sair da Conta", "Você tem certeza que deseja sair?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.profileHeader}>
          <View style={styles.avatarContainer}>
            <Image source={{ uri: user.avatar }} style={styles.avatarLarge} />
          </View>
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

        <TouchableOpacity
          style={styles.actionButtonPrimary}
          onPress={() => router.push("/(main)/edit-profile")}
        >
          <Ionicons name="pencil-outline" size={20} color="#fff" />
          <Text style={styles.actionButtonText}>Editar Perfil</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButtonSecondary}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={22} color="#FF6B6B" />
          <Text style={[styles.actionButtonText, { color: "#FF6B6B" }]}>
            Sair
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
    paddingHorizontal: 10,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerIcon: { padding: 8 },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  scrollContainer: {
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  profileHeader: {
    alignItems: "center",
    paddingVertical: 20,
    marginBottom: 10,
  },
  avatarContainer: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
    backgroundColor: "#FAF9F6", // Cor de fundo para a sombra funcionar
    borderRadius: 60,
  },
  avatarLarge: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: "#fff",
  },
  name: {
    fontSize: 26,
    fontWeight: "bold",
    marginTop: 16,
    color: "#1f2937",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    marginTop: 10,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    paddingBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
  },
  infoIcon: {
    marginRight: 20,
    width: 22, // Garante alinhamento
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
  actionButtonPrimary: {
    flexDirection: "row",
    backgroundColor: "#003249",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 30,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },
  actionButtonSecondary: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 18,
    borderRadius: 16,
    marginTop: 15,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
    borderWidth: 1,
    borderColor: "#FF6B6B",
  },
  actionButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
