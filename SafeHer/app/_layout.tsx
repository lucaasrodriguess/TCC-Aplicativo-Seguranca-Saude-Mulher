import { Slot, useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { MenuProvider } from "react-native-popup-menu";
import { UserContext, UserProvider } from "../contexts/UserContext";

function GatekeeperLayout() {
  // ATENÇÃO: É preciso importar o tipo AppUser para usar o user.emailVerified
  const { user, isLoading } = useContext(UserContext);
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    // --- LÓGICA ATUALIZADA E CORRIGIDA ---

    // Define se um usuário está realmente autorizado a entrar no app.
    // Ele precisa existir E ter o e-mail verificado.
    // Usuários do Google já vêm com 'emailVerified: true'.
    const isUserAuthorized = user && user.emailVerified;

    // 1. Se o usuário ESTÁ AUTORIZADO, mas está numa tela de autenticação (Login/Registro)...
    if (isUserAuthorized && inAuthGroup) {
      // ...mande ele para a tela principal do app.
      router.replace("/(main)/(tabs)");
    }
    // 2. Se o usuário NÃO ESTÁ AUTORIZADO, mas está tentando acessar uma tela protegida...
    else if (!isUserAuthorized && !inAuthGroup) {
      // ...mande ele de volta para o Login.
      router.replace("/(auth)/LoginScreen");
    }

    // Se nenhuma das condições acima for atendida, o usuário está onde deveria estar
    // (ex: não logado na tela de login, ou logado e verificado na tela principal).
    // Então não fazemos nada.
  }, [user, isLoading, segments, router]);

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

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
