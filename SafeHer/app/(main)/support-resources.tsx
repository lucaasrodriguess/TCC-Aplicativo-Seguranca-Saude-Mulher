import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Alert,
  Linking,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const resources = [
  {
    icon: "call-outline",
    title: "180 - Central de Atendimento à Mulher",
    description:
      "Para denúncias de violência, orientação e acolhimento. Ligação gratuita e confidencial.",
    phone: "180",
    color: "#C2185B",
  },
  {
    icon: "shield-outline",
    title: "190 - Polícia Militar",
    description: "Para emergências gerais e situações de perigo imediato.",
    phone: "190",
    color: "#1565C0",
  },
  {
    icon: "heart-outline",
    title: "188 - CVV (Apoio Emocional)",
    description:
      "Centro de Valorização da Vida, para apoio emocional e prevenção do suicídio. 24 horas.",
    phone: "188",
    color: "#FFC107",
  },
];

const makePhoneCall = async (phoneNumber: string) => {
  const url = `tel:${phoneNumber}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
    } else {
      Alert.alert("Erro", `Não foi possível abrir o discador.`);
    }
  } catch (error) {
    Alert.alert("Erro", "Ocorreu um erro inesperado.");
  }
};

export default function SupportResourcesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={28} color="#003249" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Recursos de Apoio</Text>
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.subtitle}>
          Acesse rapidamente números úteis para sua segurança e bem-estar.
        </Text>
        {resources.map((item) => (
          <TouchableOpacity
            key={item.phone}
            style={styles.card}
            onPress={() => makePhoneCall(item.phone)}
          >
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: `${item.color}20` },
              ]}
            >
              <Ionicons name={item.icon as any} size={28} color={item.color} />
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.cardDescription}>{item.description}</Text>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#ccc" />
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FAF9F6" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  backButton: { padding: 5 },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#003249",
    marginLeft: 15,
  },
  scrollContent: { padding: 20 },
  subtitle: {
    fontSize: 16,
    color: "#6c757d",
    textAlign: "center",
    marginBottom: 30,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 20,
    marginBottom: 16,
    elevation: 3,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  iconContainer: { padding: 12, borderRadius: 15, marginRight: 15 },
  cardInfo: { flex: 1 },
  cardTitle: { fontSize: 17, fontWeight: "bold", color: "#003249" },
  cardDescription: { fontSize: 13, color: "#6c757d", marginTop: 4 },
});
