import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Contact = { name: string; phone: string };

export default function EmergencyContactRegistration() {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    loadContacts();
  }, []);

  const loadContacts = async () => {
    try {
      const storedContacts = await AsyncStorage.getItem("@contacts");
      if (storedContacts) setContacts(JSON.parse(storedContacts));
    } catch (error) {
      console.log("Erro ao carregar contatos:", error);
    }
  };

  const formatPhone = (text: string) => {
    const digits = text.replace(/\D/g, "");
    if (digits.length <= 2) return `(${digits}`;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(
      7,
      11
    )}`;
  };

  const saveContact = async () => {
    const cleanedPhone = phone.replace(/\D/g, "");
    if (!name || !cleanedPhone) {
      Alert.alert("Erro", "Preencha todos os campos");
      return;
    }
    if (cleanedPhone.length < 10) {
      Alert.alert("Erro", "Digite um número de telefone válido com DDD");
      return;
    }
    const newContact = { name, phone: cleanedPhone };
    const updatedContacts = [...contacts, newContact];
    try {
      await AsyncStorage.setItem("@contacts", JSON.stringify(updatedContacts));
      setContacts(updatedContacts);
      setName("");
      setPhone("");
      Alert.alert("Sucesso", "Contato salvo!");
    } catch (error) {
      console.log("Erro ao salvar contato:", error);
    }
  };

  const confirmRemoveContact = (index: number) => {
    Alert.alert(
      "Remover Contato",
      "Tem certeza que deseja remover este contato?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: () => removeContact(index),
        },
      ]
    );
  };

  const removeContact = async (index: number) => {
    const updatedContacts = contacts.filter((_, i) => i !== index);
    try {
      await AsyncStorage.setItem("@contacts", JSON.stringify(updatedContacts));
      setContacts(updatedContacts);
      Alert.alert("Sucesso", "Contato removido!");
    } catch (error) {
      console.log("Erro ao remover contato:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cadastrar Contato</Text>
      <TextInput
        placeholder="Nome"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />
      <TextInput
        placeholder="Telefone com DDD"
        style={styles.input}
        keyboardType="phone-pad"
        value={phone}
        onChangeText={(text) => setPhone(formatPhone(text))}
        maxLength={15}
      />
      <Pressable style={styles.button} onPress={saveContact}>
        <Text style={styles.buttonText}>Salvar Contato</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#f2f2f2" },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#333",
  },
  input: {
    backgroundColor: "#fff",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
  },
  button: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
