import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Markdown from "react-native-markdown-display";
import { UserContext, UserContextType } from "../../contexts/UserContext";

// --- COMPONENTE DE CABEÇALHO ---
const Header = ({ title }: { title: string }) => {
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
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.headerIcon} />
      </View>
    </SafeAreaView>
  );
};

// --- TELA PRINCIPAL ---
export default function CuidaiScreen() {
  const [messages, setMessages] = useState<
    { text: string; user: "Você" | "Clara" }[]
  >([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const { user } = useContext(UserContext) as UserContextType;
  const scrollViewRef = useRef<ScrollView>(null);

  const { context } = useLocalSearchParams<{ context: string }>();
  const chatContext = context || "default";

  useEffect(() => {
    // Limpa o histórico ao entrar em um novo contexto de chat
    setMessages([]);
  }, [chatContext]);

  const API_URL =
    "https://us-central1-tcc-safeher.cloudfunctions.net/api/chatbot";

  const sendMessage = async () => {
    if (!input.trim() || !user || loading) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { text: userMessage, user: "Você" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage,
          userId: user.uid,
          context: chatContext,
        }),
      });
      const data = await response.json();
      const reply =
        data.reply || `⚠️ Erro: ${data.error || "Resposta inválida."}`;
      setMessages((prev) => [...prev, { text: reply, user: "Clara" }]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "❌ Não foi possível conectar. Verifique sua internet.",
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

  const getHeaderTitle = () => {
    if (chatContext === "ciclo") return "Saúde da Mulher";
    return "Apoio Psicológico";
  };

  const getInitialMessage = () => {
    if (chatContext === "ciclo")
      return "Olá! Sou a Clara, sua assistente virtual de saúde. Como posso te ajudar com seu ciclo menstrual hoje?";
    return "Olá! Sou a Clara, sua assistente de apoio. Sinta-se à vontade para desabafar ou tirar dúvidas. Como você está se sentindo?";
  };

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header title={getHeaderTitle()} />
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 60 : 0}
      >
        <ScrollView
          style={styles.chatContainer}
          contentContainerStyle={{ paddingBottom: 10 }}
          ref={scrollViewRef}
        >
          {/* Mensagem Inicial da CuidAI */}
          <View style={[styles.messageBubble, styles.botBubble]}>
            <Markdown style={markdownStyles}>{getInitialMessage()}</Markdown>
          </View>

          {messages.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.user === "Você" ? styles.userBubble : styles.botBubble,
              ]}
            >
              {msg.user === "Clara" ? (
                <Markdown style={markdownStyles}>{msg.text}</Markdown>
              ) : (
                <Text style={styles.userText}>{msg.text}</Text>
              )}
            </View>
          ))}
          {loading && (
            <View
              style={[
                styles.messageBubble,
                styles.botBubble,
                styles.typingIndicator,
              ]}
            >
              <ActivityIndicator size="small" color="#fff" />
            </View>
          )}
        </ScrollView>
        <View style={styles.inputBar}>
          <TextInput
            style={styles.textInput}
            value={input}
            onChangeText={setInput}
            placeholder="Digite sua mensagem..."
            placeholderTextColor="#999"
            editable={!loading && !!user}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              (!user || loading || !input.trim()) && styles.buttonDisabled,
            ]}
            onPress={sendMessage}
            disabled={!user || loading || !input.trim()}
          >
            <Ionicons name="arrow-up" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const markdownStyles = StyleSheet.create({
  body: { color: "#fff", fontSize: 16 },
  strong: { fontWeight: "bold" },
  list_item: { color: "#fff", fontSize: 16, marginVertical: 4 },
  link: { color: "#ADD8E6", textDecorationLine: "underline" },
});

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#FAF9F6" },
  safeArea: { backgroundColor: "#003249" },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "bold" },
  headerIcon: { padding: 10, width: 50 },
  container: { flex: 1, backgroundColor: "#FAF9F6" },

  chatContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingTop: 10,
  },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderColor: "#e0e0e0",
    backgroundColor: "#fff",
    alignItems: "flex-end", // Alinha ao fundo para inputs multiline
    paddingBottom: Platform.OS === "ios" ? 25 : 8,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#f0f0f0",
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 10,
    paddingTop: 10, // Padding superior para iOS
    marginRight: 8,
    fontSize: 16,
    maxHeight: 120, // Limita o crescimento do input
  },
  sendButton: {
    backgroundColor: "#003249",
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#a9a9a9",
  },
  messageBubble: {
    maxWidth: "80%",
    marginVertical: 5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 20,
  },
  userBubble: {
    backgroundColor: "#E5E5EA", // Cinza claro padrão
    alignSelf: "flex-end",
    borderTopRightRadius: 5,
  },
  botBubble: {
    backgroundColor: "#003249", // Azul principal
    alignSelf: "flex-start",
    borderTopLeftRadius: 5,
  },
  userText: {
    color: "#000",
    fontSize: 16,
  },
  typingIndicator: {
    width: 60,
    alignItems: "center",
  },
});
