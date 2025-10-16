import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function SplashScreen() {
  const router = useRouter();

  const handleStart = () => {
    router.replace("/(auth)/LoginScreen");
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../assets/images/logo.png")} />

      <Text style={styles.title}>
        Comprometidos com o seu bem-estar, saúde e segurança em primeiro lugar.
      </Text>
      <Text style={styles.subtitle}>
        Nosso aplicativo de segurança e saúde para mulheres oferece alertas de
        SOS com apenas um toque, rastreamento de localização em tempo real, além
        de ajudas com saúde, como ciclos menstruais.
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Começar</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  logo: {
    fontSize: 40,
    color: "#9C6ADE",
    marginBottom: 10,
  },
  image: {
    width: 200,
    height: 200,
    resizeMode: "contain",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 14,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#000",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
