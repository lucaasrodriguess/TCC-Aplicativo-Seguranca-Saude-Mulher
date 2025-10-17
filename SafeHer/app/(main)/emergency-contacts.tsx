import React, { useState, useContext } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useRouter, useFocusEffect } from "expo-router";
import { UserContext, UserContextType } from "../../contexts/UserContext";
import { db } from "../../services/firebaseConfig";
import { collection, query, getDocs, doc, deleteDoc } from "firebase/firestore";

type Contact = { id: string; name: string; phone: string };

export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const router = useRouter();
  const { user } = useContext(UserContext) as UserContextType;

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

  const confirmRemoveContact = (contactId: string) => {
    Alert.alert(
      "Remover Contato",
      "Tem certeza que deseja remover este contato?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeContact(contactId),
        },
      ]
    );
  };

  const removeContact = async (contactId: string) => {
    if (!user) return;
    try {
      const contactDocRef = doc(
        db,
        "users",
        user.uid,
        "emergency_contacts",
        contactId
      );
      await deleteDoc(contactDocRef);
      // Recarrega a lista para refletir a remoção
      loadContacts();
      Alert.alert("Sucesso", "Contato removido!");
    } catch (error) {
      console.log("Erro ao remover contato do Firebase:", error);
    }
  };

  const renderContactCard = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <View>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardPhone}>{item.phone}</Text>
      </View>
      <Pressable
        style={styles.removeButton}
        onPress={() => confirmRemoveContact(item.id)}
      >
        <Text style={styles.removeButtonText}>Remover</Text>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Contatos de Emergência</Text>
      {contacts.length === 0 ? (
        <Text style={styles.noContactsText}>Nenhum contato cadastrado.</Text>
      ) : (
        <FlatList
          data={contacts}
          keyExtractor={(item) => item.id}
          renderItem={renderContactCard}
        />
      )}
      <Pressable
        style={styles.button}
        onPress={() => router.push("/(main)/emergency-contact-registration")}
      >
        <Text style={styles.buttonText}>Adicionar Contato</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    paddingTop: 30,
    marginBottom: 20,
    color: "#333",
    textAlign: "center",
  },
  noContactsText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 16,
    color: "#666",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cardPhone: { fontSize: 16, color: "#555", marginTop: 5 },
  removeButton: {
    backgroundColor: "#E53935",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  removeButtonText: { color: "#fff", fontWeight: "bold" },
  button: {
    marginTop: 30,
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
