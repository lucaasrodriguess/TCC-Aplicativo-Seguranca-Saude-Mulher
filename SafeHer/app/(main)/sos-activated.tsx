// app/(main)/sos-activated.tsx
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const makePhoneCall = async (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  const supported = await Linking.canOpenURL(url);
  if (supported) {
    await Linking.openURL(url);
  } else {
    Alert.alert("Erro", `Não foi possível abrir o discador.`);
  }
};

export default function SosActivatedScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
        <Text style={styles.title}>SOS Ativado!</Text>
        <Text style={styles.subtitle}>
          Seus contatos de emergência foram notificados com sua localização.
        </Text>

        <View style={styles.actionsContainer}>
          <Text style={styles.actionsTitle}>
            Precisa de mais ajuda? Ligue para:
          </Text>
          <TouchableOpacity
            style={[styles.callButton, styles.policeButton]}
            onPress={() => makePhoneCall("190")}
          >
            <Ionicons name="shield" size={28} color="#fff" />
            <Text style={styles.callButtonText}>Ligar 190 (Polícia)</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.callButton, styles.womenHelplineButton]}
            onPress={() => makePhoneCall("180")}
          >
            <Ionicons name="woman" size={28} color="#fff" />
            <Text style={styles.callButtonText}>
              Ligar 180 (Atendimento à Mulher)
            </Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.doneButton}
          onPress={() => router.replace("./(tabs)/security")}
        >
          <Text style={styles.doneButtonText}>Estou segura agora</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ... (Adicione os estilos abaixo)
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6", justifyContent: "center" },
  content: { padding: 20, alignItems: "center" },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003249",
    marginTop: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 40,
  },
  actionsContainer: { width: "100%", alignItems: "center", marginBottom: 40 },
  actionsTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#333",
    marginBottom: 20,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    marginBottom: 16,
    elevation: 4,
  },
  policeButton: { backgroundColor: "#1565C0" },
  womenHelplineButton: { backgroundColor: "#C2185B" },
  callButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 12,
  },
  doneButton: { padding: 16, borderRadius: 16 },
  doneButtonText: { color: "#003249", fontSize: 16, fontWeight: "bold" },
});
