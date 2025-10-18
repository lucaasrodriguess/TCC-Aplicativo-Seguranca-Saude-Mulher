import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

// --- DADOS DA LEGENDA ---
const legendItems = [
  { color: "#FFB6C1", label: "Dias de Menstruação" },
  { color: "#98FB98", label: "Período Fértil" },
  { color: "#ADD8E6", label: "Dia da Ovulação" },
  { color: "#D3D3D3", label: "Próxima Menstruação (Previsão)" },
];

// --- COMPONENTE DE CABEÇALHO ---
const Header = () => {
  const router = useRouter();
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerIcon}
        >
          <Ionicons name="chevron-back" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Legenda do Calendário</Text>
        <View style={styles.headerIcon} />
      </View>
    </SafeAreaView>
  );
};

// --- TELA PRINCIPAL ---
export default function InfoScreen() {
  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <ScrollView contentContainerStyle={styles.contentContainer}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Entenda as Cores</Text>
          {legendItems.map((item) => (
            <View key={item.label} style={styles.legendItem}>
              <View
                style={[styles.legendDot, { backgroundColor: item.color }]}
              />
              <Text style={styles.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  safeArea: {
    backgroundColor: "#003249",
  },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  headerIcon: {
    padding: 10,
    width: 50, // Garante espaço para o título ficar centralizado
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 20,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  legendDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 15,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.05)",
  },
  legendText: {
    fontSize: 16,
    color: "#444",
  },
});
