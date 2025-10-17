import React, { useState, useContext } from "react";
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  Alert,
} from "react-native";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import { UserContext, UserContextType } from "../../../contexts/UserContext";
import { db } from "../../../services/firebaseConfig";
import { collection, query, getDocs } from "firebase/firestore";

type Contact = { id: string; name: string; phone: string };

export default function SecurityScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const router = useRouter();
  const { user } = useContext(UserContext) as UserContextType;

  // Busca os contatos do Firebase toda vez que a tela é focada
  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadContacts();
      }
    }, [user])
  );

  const loadContacts = async () => {
    if (!user) return;
    try {
      const contactsQuery = query(
        collection(db, "users", user.uid, "emergency_contacts")
      );
      const querySnapshot = await getDocs(contactsQuery);
      const fetchedContacts: Contact[] = [];
      querySnapshot.forEach((doc) => {
        fetchedContacts.push({ id: doc.id, ...doc.data() } as Contact);
      });
      setContacts(fetchedContacts);
    } catch (error) {
      console.log("Erro ao carregar contatos do Firebase:", error);
    }
  };

  const sendSOS = async () => {
    if (contacts.length === 0) {
      Alert.alert(
        "Nenhum Contato de Emergência",
        "Por favor, adicione contatos de emergência antes de usar a função SOS.",
        [
          {
            text: "OK",
            onPress: () => router.push("/(main)/emergency-contacts"),
          },
        ]
      );
      return;
    }
    // ... (O resto da função sendSOS continua exatamente a mesma)
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Não foi possível acessar sua localização."
        );
        return;
      }
      const location = await Location.getCurrentPositionAsync({});
      const { latitude, longitude } = location.coords;
      const message = `🚨 SOS! Preciso de ajuda urgente.\nMinha localização: https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert("Erro", "Seu dispositivo não suporta envio de SMS.");
        return;
      }
      const numbers = contacts.map((contact) => contact.phone);
      await SMS.sendSMSAsync(numbers, message);
      Alert.alert("Sucesso", "Mensagem SOS enviada via SMS!");
    } catch (error) {
      console.error(error);
      Alert.alert("Erro", "Não foi possível enviar o SOS.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Segurança</Text>
      <Text style={styles.subtitle}>
        Confira o que temos para te oferecer quando se trata da sua segurança!
      </Text>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(main)/emergency-contacts")}
      >
        <Ionicons name="call-outline" size={24} color="#333" />
        <Text style={styles.buttonText}>Contatos de emergência</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("/(main)/my-location")}
      >
        <Ionicons name="location-outline" size={24} color="#333" />
        <Text style={styles.buttonText}>Minha Localização</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.sosButton} onPress={sendSOS}>
        <Ionicons name="alert-circle-outline" size={24} color="#fff" />
        <Text style={styles.sosText}>SOS</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9f9f9",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: { fontSize: 22, fontWeight: "bold", marginBottom: 8, color: "#333" },
  subtitle: {
    fontSize: 14,
    textAlign: "center",
    color: "#666",
    marginBottom: 30,
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
    width: "100%",
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  buttonText: {
    fontSize: 16,
    marginLeft: 10,
    fontWeight: "600",
    color: "#333",
  },
  sosButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    paddingVertical: 18,
    borderRadius: 15,
    width: "100%",
    marginTop: 20,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
    elevation: 5,
  },
  sosText: { fontSize: 18, fontWeight: "bold", color: "#fff", marginLeft: 8 },
});
