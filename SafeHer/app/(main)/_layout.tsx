// Arquivo: app/(main)/_layout.tsx

import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Drawer } from "expo-router/drawer";
import React, { useContext } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { UserContext, UserContextType } from "../../contexts/UserContext"; // Ajuste o caminho se necessário

// --- COMPONENTE CUSTOMIZADO PARA O CONTEÚDO DO MENU ---
const CustomDrawerContent = (props: any) => {
  const context = useContext(UserContext) as UserContextType;
  const router = useRouter();
  const user = context?.user;

  if (!user) {
    return null; // Não mostra o conteúdo do menu se o usuário não estiver logado
  }

  const navigateTo = (screen: string) => {
    router.push(screen as any);
    props.navigation.closeDrawer();
  };

  const handleLogout = () => {
    props.navigation.closeDrawer();
    context.logout(); // O layout raiz (porteiro) vai detectar a mudança e redirecionar
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <View style={styles.drawerContainer}>
        <Pressable
          onPress={() => navigateTo("/(main)/profile")}
          style={styles.drawerHeader}
        >
          <Image source={{ uri: user.avatar }} style={styles.drawerAvatar} />
          <Text style={styles.drawerUserName}>{user.name}</Text>
          <Text style={styles.drawerUserEmail}>{user.email}</Text>
        </Pressable>

        <View style={styles.drawerItems}>
          <Pressable
            onPress={() => navigateTo("/(main)/(tabs)")}
            style={styles.drawerItem}
          >
            <Ionicons name="home-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Início</Text>
          </Pressable>
          <Pressable
            onPress={() => navigateTo("/(main)/(tabs)/health")}
            style={styles.drawerItem}
          >
            <Ionicons name="medkit-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Saúde</Text>
          </Pressable>
          <Pressable
            onPress={() => navigateTo("/(main)/(tabs)/security")}
            style={styles.drawerItem}
          >
            <Ionicons name="shield-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Segurança</Text>
          </Pressable>
          <Pressable
            onPress={() => navigateTo("/(main)/profile")}
            style={styles.drawerItem}
          >
            <Ionicons name="person-outline" size={22} color="#333" />
            <Text style={styles.drawerItemText}>Meu Perfil</Text>
          </Pressable>
        </View>

        <View style={{ flex: 1 }} />

        <Pressable
          onPress={handleLogout}
          style={[styles.drawerItem, styles.logoutItem]}
        >
          <Ionicons name="log-out-outline" size={22} color="#ef4444" />
          <Text
            style={[
              styles.drawerItemText,
              { color: "#ef4444", fontWeight: "bold" },
            ]}
          >
            Sair
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

// --- NAVEGADOR DRAWER PARA A ÁREA LOGADA ---
export default function MainAppLayout() {
  return (
    <Drawer
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: { width: "80%" },
      }}
    >
      <Drawer.Screen name="(tabs)" options={{ title: "Início" }} />
      <Drawer.Screen
        name="profile"
        options={{ drawerItemStyle: { display: "none" } }}
      />
      <Drawer.Screen
        name="edit-profile"
        options={{ drawerItemStyle: { display: "none" } }}
      />
    </Drawer>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  drawerContainer: { flex: 1 },
  drawerHeader: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingTop: 40,
    marginBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    alignItems: "center",
  },
  drawerAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: 12,
  },
  drawerUserName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  drawerUserEmail: {
    fontSize: 14,
    color: "#6b7280",
  },
  drawerItems: { padding: 10 },
  drawerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginBottom: 5,
    gap: 15,
  },
  drawerItemText: {
    fontSize: 16,
    fontWeight: "500",
    color: "#374151",
  },
  logoutItem: {
    marginBottom: 20,
  },
});
