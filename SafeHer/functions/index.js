const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");

admin.initializeApp();

const { CUIDAI_API_KEY } = process.env;

const prompts = {
  ciclo: `Você é Clara, uma assistente especialista em saúde menstrual...`, // Seu prompt de ciclo aqui
  psicologico: `Você é Clara, uma conselheira de bem-estar e apoio emocional...`, // Seu prompt psicológico aqui
  default: `Você é Clara, uma assistente de saúde virtual empática...`, // Seu prompt padrão aqui
};

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

const chatHistories = {};

app.post("/chatbot", async (req, res) => {
  if (!CUIDAI_API_KEY) {
    logger.error("ERRO CRÍTICO: O secret CUIDAI_API_KEY não foi encontrado.");
    return res
      .status(500)
      .json({ error: "Configuração do servidor incompleta." });
  }

  const { message, userId, context } = req.body;
  if (!message || !userId) {
    return res
      .status(400)
      .json({ error: "Os campos 'message' e 'userId' são obrigatórios." });
  }

  // ===================================================================
  // ### A CORREÇÃO DA MEMÓRIA ESTÁ AQUI ###
  // Criamos uma chave única para cada contexto de conversa do usuário.
  // ===================================================================
  const historyKey = `${userId}_${context || "default"}`;

  if (!chatHistories[historyKey]) {
    const selectedPrompt = prompts[context] || prompts.default;
    chatHistories[historyKey] = [selectedPrompt];
  }
  chatHistories[historyKey].push(message);

  const fullHistory = chatHistories[historyKey];
  const systemPrompt = fullHistory[0];
  const recentMessages = fullHistory.slice(-10);
  const contextToSend = [systemPrompt, ...recentMessages];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${CUIDAI_API_KEY}`;

  const body = {
    contents: contextToSend.map((msg, index) => ({
      role: index % 2 === 0 ? "user" : "model",
      parts: [{ text: msg }],
    })),
  };

  try {
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await geminiResponse.json();

    if (!geminiResponse.ok) {
      logger.error(
        "A API do Gemini respondeu com um erro. Detalhes:",
        JSON.stringify(data, null, 2)
      );
      return res
        .status(502)
        .json({ error: "Erro ao se comunicar com a IA.", details: data });
    }

    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text ||
      "Desculpe, não consegui gerar uma resposta.";
    chatHistories[historyKey].push(reply); // Salva no histórico correto

    return res.json({ reply });
  } catch (error) {
    logger.error("Erro no servidor da função:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

exports.api = onRequest({ secrets: ["CUIDAI_API_KEY"] }, app);
