const { onRequest } = require("firebase-functions/v2/https");
const { logger } = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");

admin.initializeApp();

const { CUIDAI_API_KEY } = process.env;

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

  const { message, userId } = req.body;
  if (!message || !userId) {
    return res
      .status(400)
      .json({ error: "Os campos 'message' e 'userId' são obrigatórios." });
  }

  if (!chatHistories[userId]) {
    chatHistories[userId] = [
      `Você é Clara, uma assistente de saúde virtual empática...`,
    ];
  }
  chatHistories[userId].push(message);

  // ===================================================================
  // ### A CORREÇÃO FINAL ESTÁ AQUI ###
  // Usando 'gemini-flash-latest', um modelo que está na sua lista de permissões.
  // ===================================================================
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${CUIDAI_API_KEY}`;

  const body = {
    contents: chatHistories[userId].map((msg, index) => ({
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
    chatHistories[userId].push(reply);

    return res.json({ reply });
  } catch (error) {
    logger.error("Erro no servidor da função:", error);
    return res.status(500).json({ error: "Erro interno no servidor." });
  }
});

exports.api = onRequest({ secrets: ["CUIDAI_API_KEY"] }, app);
