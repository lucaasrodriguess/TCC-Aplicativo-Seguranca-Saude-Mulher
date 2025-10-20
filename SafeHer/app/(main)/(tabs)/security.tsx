import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
// Importa o serviço que contém a lógica de pânico
import { triggerPanicActions } from "../../../services/panicService";

export default function SecurityScreen() {
  const [isPanicLoading, setIsPanicLoading] = useState(false);
  const router = useRouter();

 
  const handleNormalPress = () => {
    if (isPanicLoading) return; // Impede a ação se o pânico já estiver sendo acionado
    // CORREÇÃO: Caminho absoluto para a rota dentro do grupo (main)
    router.push("../support-resources");
  };


  const handleLongPress = () => {
    Alert.alert(
      "Ativar Modo Pânico?",
      "Uma mensagem de ajuda com sua localização será enviada para seus contatos de emergência.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Confirmar",
          style: "destructive",
          onPress: async () => {
            setIsPanicLoading(true);
            const success = await triggerPanicActions(); // Chama a lógica centralizada
            setIsPanicLoading(false);

            if (success) {
              // CORREÇÃO: Caminho absoluto para a rota dentro do grupo (main)
              // Usa 'replace' para impedir que o usuário volte para esta tela
              router.replace("../sos-activated");
            } else {
              // A função triggerPanicActions já exibe alertas de erro específicos
              console.log(
                "Falha ao acionar o modo pânico. Verifique os logs e as permissões."
              );
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Sua Segurança</Text>
        <Text style={styles.subtitle}>
          Recursos rápidos para momentos em que você mais precisa.
        </Text>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("../emergency-contacts")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#E0FFFF" }]}>
            <Ionicons name="call-outline" size={28} color="#48D1CC" />
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Contatos de Emergência</Text>
            <Text style={styles.buttonSubtitle}>Adicione quem você confia</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => router.push("../my-location")}
        >
          <View style={[styles.iconContainer, { backgroundColor: "#FFF0F5" }]}>
            <Ionicons name="location-outline" size={28} color="#FF6A6A" />
          </View>
          <View style={styles.buttonContent}>
            <Text style={styles.buttonText}>Minha Localização</Text>
            <Text style={styles.buttonSubtitle}>
              Compartilhe onde você está
            </Text>
          </View>
        </TouchableOpacity>

        {/* BOTÃO SOS ATUALIZADO com as novas funcionalidades */}
        <TouchableOpacity
          style={styles.sosButton}
          onPress={handleNormalPress}
          onLongPress={handleLongPress}
          delayLongPress={3000} // Ativa o onLongPress após 3 segundos
          disabled={isPanicLoading}
          activeOpacity={0.8}
        >
          {isPanicLoading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="alert-circle-outline" size={32} color="#fff" />
              <Text style={styles.sosText}>PEDIR AJUDA (SOS)</Text>
            </>
          )}
        </TouchableOpacity>
        <Text style={styles.sosInstruction}>
          Toque para ver recursos, pressione por 3s para pânico.
        </Text>
      </View>
    </SafeAreaView>
  );
}

// Seus estilos (styles) continuam os mesmos, com a adição do sosInstruction
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#003249",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    color: "#6c757d",
    marginBottom: 40,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    width: "100%",
    marginBottom: 16,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 15,
  },
  buttonContent: {
    marginLeft: 16,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#003249",
  },
  buttonSubtitle: {
    fontSize: 13,
    color: "#6c757d",
    marginTop: 2,
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FF6B6B",
    paddingVertical: 20,
    borderRadius: 20,
    width: "100%",
    marginTop: 20,
    shadowColor: "#FF6B6B",
    shadowOpacity: 0.4,
    shadowOffset: { width: 0, height: 5 },
    shadowRadius: 10,
    elevation: 8,
  },
  sosText: { fontSize: 18, fontWeight: "bold", color: "#fff", marginLeft: 12 },
  sosInstruction: {
    // Estilo para a nova instrução
    textAlign: "center",
    color: "#6c757d",
    marginTop: 12,
    fontSize: 12,
  },
});
