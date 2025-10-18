import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { DrawerActions } from "@react-navigation/native";
import { collection, deleteDoc, doc, getDocs, query } from "firebase/firestore";
import { UserContext, UserContextType } from "../../contexts/UserContext";
import { db } from "../../services/firebaseConfig";

type Contact = { id: string; name: string; phone: string };

// --- COMPONENTE DE CABEÇALHO PADRÃO ---
const Header = () => {
  const navigation = useNavigation();
  const { user } = useContext(UserContext) as UserContextType;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerIcon}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Contatos de Emergência</Text>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerIcon}
        >
          {user?.avatar && (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// --- TELA PRINCIPAL ---
export default function EmergencyContactsScreen() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { user } = useContext(UserContext) as UserContextType;

  useFocusEffect(
    React.useCallback(() => {
      if (user) {
        loadContacts();
      } else {
        setIsLoading(false);
      }
    }, [user])
  );

  const loadContacts = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const contactsQuery = query(
        collection(db, "users", user.uid, "emergency_contacts")
      );
      const querySnapshot = await getDocs(contactsQuery);
      const fetchedContacts: Contact[] = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Contact, "id">),
      }));
      setContacts(fetchedContacts);
    } catch (error) {
      console.log("Erro ao carregar contatos:", error);
      Alert.alert("Erro", "Não foi possível carregar os contatos.");
    } finally {
      setIsLoading(false);
    }
  };

  const confirmRemoveContact = (contact: Contact) => {
    Alert.alert(
      "Remover Contato",
      `Tem certeza que deseja remover ${contact.name}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeContact(contact.id),
        },
      ]
    );
  };

  const removeContact = async (contactId: string) => {
    if (!user) return;
    try {
      await deleteDoc(
        doc(db, "users", user.uid, "emergency_contacts", contactId)
      );
      loadContacts(); // Recarrega a lista para refletir a remoção
    } catch (error) {
      console.log("Erro ao remover contato:", error);
      Alert.alert("Erro", "Não foi possível remover o contato.");
    }
  };

  const renderContactCard = ({ item }: { item: Contact }) => (
    <View style={styles.card}>
      <Ionicons name="person-circle-outline" size={40} color="#003249" />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.name}</Text>
        <Text style={styles.cardPhone}>{item.phone}</Text>
      </View>
      <TouchableOpacity
        style={styles.removeButton}
        onPress={() => confirmRemoveContact(item)}
      >
        <Ionicons name="trash-outline" size={24} color="#FF6B6B" />
      </TouchableOpacity>
    </View>
  );

  const ListEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={60} color="#ccc" />
      <Text style={styles.noContactsText}>Nenhum contato cadastrado.</Text>
      <Text style={styles.noContactsSubText}>
        Adicione pessoas de confiança para contatar em uma emergência.
      </Text>
    </View>
  );

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <View style={styles.contentContainer}>
        {isLoading ? (
          <ActivityIndicator
            size="large"
            color="#003249"
            style={{ marginTop: 50 }}
          />
        ) : (
          <FlatList
            data={contacts}
            keyExtractor={(item) => item.id}
            renderItem={renderContactCard}
            ListEmptyComponent={ListEmptyComponent}
            contentContainerStyle={{ flexGrow: 1 }}
          />
        )}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => router.push("/(main)/emergency-contact-registration")}
        >
          <Ionicons name="add-circle-outline" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Adicionar Contato</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#FAF9F6" },
  safeArea: { backgroundColor: "#003249" },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerIcon: { padding: 8 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  contentContainer: {
    flex: 1,
    padding: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: 100, // Espaço para o botão
  },
  noContactsText: {
    marginTop: 20,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "bold",
    color: "#555",
  },
  noContactsSubText: {
    marginTop: 8,
    textAlign: "center",
    fontSize: 14,
    color: "#888",
    maxWidth: "80%",
  },
  card: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 16,
    marginVertical: 8,
    shadowColor: "#9E9E9E",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: { fontSize: 18, fontWeight: "bold", color: "#333" },
  cardPhone: { fontSize: 16, color: "#555", marginTop: 4 },
  removeButton: {
    padding: 8,
  },
  addButton: {
    backgroundColor: "#003249",
    padding: 15,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 10,
    marginTop: 20,
  },
  addButtonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
