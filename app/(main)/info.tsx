import { Ionicons } from "@expo/vector-icons"; // ícones nativos do Expo
import { useRouter } from "expo-router";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function InfoScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* Fundo com blur */}

      <View style={styles.content}>
        {/* Botão de Voltar */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#9333ea" />
          <Text style={styles.backText}>Voltar</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Informações do Calendário</Text>

        <View style={styles.card}>
          <Text style={styles.item}>🔴 Vermelho: Dias de Menstruação</Text>
          <Text style={styles.item}>🟢 Verde Claro: Período Fértil</Text>
          <Text style={styles.item}>🟣 Roxo: Dia da Ovulação</Text>
          <Text style={styles.item}>
            ⚪ Cinza: Próxima Menstruação Prevista
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 40,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",

    marginBottom: 16,
  },
  card: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  item: {
    fontSize: 16,
    color: "#444",
    marginBottom: 12,
  },
  backText: {
    marginLeft: 6,
    fontSize: 16,
    color: "#9333ea",
    fontWeight: "600",
  },
});
