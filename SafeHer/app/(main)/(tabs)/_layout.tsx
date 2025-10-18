import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React, { useContext } from "react"; // Adiciona useContext
import { StyleSheet, TouchableOpacity, View } from "react-native";
import { PostModalContext } from "../../../contexts/PostModalContext"; // Importa o contexto do modal

const CreatePostButton = () => (
  <View style={styles.createButtonContainer}>
    <Ionicons name="add" size={32} color="#fff" />
  </View>
);

export default function TabsLayout() {
  // Pega a função para controlar o modal do nosso contexto
  const { setPostModalVisible } = useContext(PostModalContext);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: "#003249",
        tabBarInactiveTintColor: "#A9A9A9",
        tabBarStyle: styles.tabBar,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="security"
        options={{
          title: "Segurança",
          tabBarIcon: ({ color, size }) => (
            <Ionicons
              name="shield-checkmark-outline"
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* Botão de Criar Post no meio */}
      <Tabs.Screen
        name="create-post"
        options={{
          tabBarIcon: () => <CreatePostButton />,
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPress={() => setPostModalVisible(true)}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="health"
        options={{
          title: "Saúde",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Perfil",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Telas que não aparecem na barra de abas */}
      <Tabs.Screen name="cycle" options={{ href: null }} />
      <Tabs.Screen name="edit-profile" options={{ href: null }} />
      <Tabs.Screen name="info" options={{ href: null }} />
      <Tabs.Screen name="cuidai" options={{ href: null }} />
      <Tabs.Screen name="emergency-contacts" options={{ href: null }} />
      <Tabs.Screen
        name="emergency-contact-registration"
        options={{ href: null }}
      />
      <Tabs.Screen name="my-location" options={{ href: null }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: "absolute",
    bottom: 25,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 20,
    backgroundColor: "#ffffff",
    borderTopWidth: 0,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 10,
  },
  createButtonContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#FF6B6B",
    justifyContent: "center",
    alignItems: "center",
    marginTop: -30,
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
    borderWidth: 3,
    borderColor: "#FAF9F6",
  },
});
