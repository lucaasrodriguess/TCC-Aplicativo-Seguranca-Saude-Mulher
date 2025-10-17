import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";

export default function HealthScreen() {
  const router = useRouter();

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Saúde</Text>
      <Text style={styles.subtitle}>
        Confira o que temos pra te oferecer quando se trata da sua saúde!
      </Text>

      {/* Card Ciclo Menstrual */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("/cycle")}
      >
        <Ionicons name="calendar" size={28} color="#9333ea" />
        <Text style={styles.cardText}>Ciclo Menstrual</Text>
      </TouchableOpacity>

      {/* Card Apoio Psicológico */}
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push("../cuidai")}
      >
        <Ionicons name="chatbubbles" size={28} color="#9333ea" />
        <Text style={styles.cardText}>Apoio Psicológico</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 16,
    paddingVertical: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "#666",
    marginBottom: 20,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  cardText: {
    marginLeft: 12,
    fontSize: 18,
    fontWeight: "600",
    color: "#444",
  },
});
