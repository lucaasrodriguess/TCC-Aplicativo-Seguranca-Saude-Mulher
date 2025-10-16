import { Slot, useRouter, useSegments } from "expo-router";
import React, { useContext, useEffect } from "react";
import { MenuProvider } from "react-native-popup-menu";
import {
  UserContext,
  UserContextType,
  UserProvider,
} from "../contexts/UserContext";

function GatekeeperLayout() {
  const { user, isLoading } = useContext(UserContext) as UserContextType;
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    // Enquanto carrega, não faz nada. A SplashScreen é mostrada.
    if (isLoading) {
      return;
    }

    const inAuthGroup = segments[0] === "(auth)";

    // Esta condição serve tanto para LOGIN quanto para REGISTRO
    if (user && inAuthGroup) {
      // Se o usuário está logado e na tela de login/registro, manda para o app principal
      router.replace("/(main)/(tabs)"); // <--- Verifique se o caminho está explícito
    } else if (!user && !inAuthGroup) {
      // Se o usuário não está logado e não está na tela de login, manda para o login
      router.replace("/(auth)/LoginScreen");
    }
  }, [user, isLoading, segments, router]);

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
