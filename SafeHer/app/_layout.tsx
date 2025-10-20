import { Slot, useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { MenuProvider } from "react-native-popup-menu";
import { UserContext, UserProvider } from "../contexts/UserContext";

function GatekeeperLayout() {
  const { user, isLoading } = useContext(UserContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // 1. Não faça nada enquanto o UserContext estiver na verificação inicial.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    // 2. Se o usuário ESTÁ logado e está tentando acessar uma tela de auth...
    if (user && inAuthGroup) {
      // ...redirecione-o para a tela principal.
      // Usamos o caminho para o layout das tabs.
      router.replace("/(main)/(tabs)");
    }
    // 3. Se o usuário NÃO ESTÁ logado e NÃO está em uma tela de auth...
    else if (!user && !inAuthGroup) {
      // ...force-o a ir para o Login.
      router.replace("/(auth)/LoginScreen");
    }
  }, [user, isLoading, segments, router]); // Dependências corretas

  // Mostra um loading full-screen para evitar que a tela de login "pisque" rapidamente
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

  // Renderiza a rota atual (seja do grupo 'auth' ou 'main')
  return <Slot />;
}

export default function RootLayout() {
  return (
    <MenuProvider>
      <UserProvider>
        <GatekeeperLayout />
      </UserProvider>
    </MenuProvider>
  );
}
