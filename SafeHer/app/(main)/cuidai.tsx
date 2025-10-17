import React, { useState, useRef, useEffect, useContext } from "react";
import {
  View,
  TextInput,
  Text,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { UserContext, UserContextType } from "../../contexts/UserContext"; // ATENÇÃO: Verifique se o caminho para seu UserContext está correto

export default function CuidaiScreen() {
  const [messages, setMessages] = useState<{ text: string; user: string }[]>(
    []
  );
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext) as UserContextType;
  const scrollViewRef = useRef<ScrollView>(null);
  const router = useRouter();

  // URL FINAL E CORRETA da sua API rodando na nuvem!
  const API_URL =
    "https://us-central1-tcc-safeher.cloudfunctions.net/api/chatbot";

  const sendMessage = async () => {
    if (!input.trim() || !user) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, user: "Você" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage, userId: user.uid }),
      });

      const data = await response.json();

      if (response.ok && data.reply) {
        setMessages((prev) => [...prev, { text: data.reply, user: "Clara" }]);
      } else {
        // Mostra o erro detalhado que vem do servidor, se houver
        const errorMessage =
          data.details?.error?.message ||
          data.error ||
          "Resposta inválida do servidor.";
        setMessages((prev) => [
          ...prev,
          {
            text: `⚠️ Erro do servidor: ${errorMessage}`,
            user: "Clara",
          },
        ]);
      }
    } catch (error: any) {
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ Não foi possível conectar à assistente. Verifique sua conexão com a internet e tente novamente.",
          user: "Clara",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    scrollViewRef.current?.scrollToEnd({ animated: true });
  }, [messages, loading]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0} // Ajuste fino para o teclado
    >
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Assistente de Saúde Clara</Text>
        <View style={{ width: 40 }} />
        {/* Espaço para centralizar o título */}
      </View>

      <ScrollView
        style={styles.chatBox}
        contentContainerStyle={{ paddingBottom: 10 }}
        ref={scrollViewRef}
      >
        {messages.length === 0 && !loading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <Text style={styles.botText}>
              Olá! Sou a Clara, sua assistente de saúde virtual. Lembre-se que
              não forneço diagnósticos. Como posso te ajudar hoje?
            </Text>
          </View>
        )}
        {messages.map((msg, index) => (
          <View
            key={index}
            style={[
              styles.messageBubble,
              msg.user === "Você" ? styles.userBubble : styles.botBubble,
            ]}
          >
            <Text
              style={msg.user === "Você" ? styles.userText : styles.botText}
            >
              {msg.text}
            </Text>
          </View>
        ))}
        {loading && (
          <View style={[styles.messageBubble, styles.botBubble]}>
            <ActivityIndicator size="small" color="#fff" />
          </View>
        )}
      </ScrollView>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua dúvida..."
          placeholderTextColor="#999"
          editable={!loading && !!user}
        />
        <TouchableOpacity
          style={[
            styles.sendButton,
            (!user || loading || !input.trim()) && { backgroundColor: "#ccc" },
          ]}
          onPress={sendMessage}
          disabled={!user || loading || !input.trim()}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? 40 : 50,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  chatBox: { flex: 1, paddingHorizontal: 10, paddingTop: 10 },
  inputContainer: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    alignItems: "center",
    paddingBottom: Platform.OS === "ios" ? 20 : 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    backgroundColor: "#f9f9f9",
    marginRight: 8,
    fontSize: 16,
  },
  sendButton: {
    backgroundColor: "#9C6ADE", // Cor roxa do seu app
    width: 45,
    height: 45,
    borderRadius: 25,
    justifyContent: "center",
    alignItems: "center",
  },
  messageBubble: {
    maxWidth: "80%",
    marginVertical: 5,
    padding: 12,
    borderRadius: 18,
  },
  userBubble: {
    backgroundColor: "#f1f0f0",
    alignSelf: "flex-end",
    borderTopRightRadius: 4,
  },
  botBubble: {
    backgroundColor: "#9C6ADE", // Cor roxa do seu app
    alignSelf: "flex-start",
    borderTopLeftRadius: 4,
  },
  userText: { color: "#333", fontSize: 16 },
  botText: { color: "#fff", fontSize: 16 },
});
