import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function HealthScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Sua Jornada de Saúde</Text>
          <Text style={styles.subtitle}>
            Ferramentas e informações para cuidar de você todos os dias.
          </Text>
        </View>

        {/* Card Ciclo Menstrual */}
        <TouchableOpacity onPress={() => router.push("../cycle")}>
          <View style={styles.card}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#FFE4E1" }]}
            >
              <Ionicons name="calendar-outline" size={30} color="#FA8072" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Ciclo Menstrual</Text>
              <Text style={styles.cardSubtitle}>
                Acompanhe suas fases e sintomas
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#A9A9A9" />
          </View>
        </TouchableOpacity>

        {/* Card Apoio Psicológico */}
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(main)/cuidai",
              params: { context: "psicologico" },
            })
          }
        >
          <View style={styles.card}>
            <View
              style={[styles.iconContainer, { backgroundColor: "#E0FFFF" }]}
            >
              <Ionicons name="chatbubbles-outline" size={30} color="#48D1CC" />
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardTitle}>Apoio Psicológico</Text>
              <Text style={styles.cardSubtitle}>
                Converse com a assistente Clara
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#A9A9A9" />
          </View>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FAF9F6", // Fundo creme/off-white
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  headerContainer: {
    alignItems: "center",
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#003249", // Azul escuro
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#6c757d", // Cinza médio
    textAlign: "center",
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    shadowColor: "#9E9E9E",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 5,
  },
  iconContainer: {
    padding: 12,
    borderRadius: 15,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "bold",
    color: "#003249",
  },
  cardSubtitle: {
    fontSize: 14,
    color: "#6c757d",
    marginTop: 4,
  },
});
