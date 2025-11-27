// --- IMPORTAÇÕES 100% GEN 2 ---
const { onRequest } = require("firebase-functions/v2/https");
const { onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { logger } = require("firebase-functions"); // Logger é padrão
const { setGlobalOptions } = require("firebase-functions/v2");

const admin = require("firebase-admin");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fetch = require("node-fetch");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Configuração Global (opcional, ajuda a evitar erros de região)
setGlobalOptions({ region: "us-central1" });

// ==================================================================
// 🤖 PARTE 1: CHATBOT (Gen 2)
// ==================================================================
const { CUIDAI_API_KEY } = process.env;

const prompts = {
  ciclo: `Você é Clara, uma assistente especialista em saúde menstrual...`,
  psicologico: `Você é Clara, uma conselheira de bem-estar e apoio emocional...`,
  default: `Você é Clara, uma assistente de saúde virtual empática...`,
};

const app = express();
app.use(cors({ origin: true }));
app.use(bodyParser.json());

// Memória volátil simples
const chatHistories = {};

app.post("/chatbot", async (req, res) => {
  if (!CUIDAI_API_KEY) {
    logger.error("ERRO CRÍTICO: CUIDAI_API_KEY não encontrada.");
    return res.status(500).json({ error: "Erro de configuração." });
  }

  const { message, userId, context } = req.body;
  if (!message || !userId) {
    return res.status(400).json({ error: "Dados incompletos." });
  }

  const historyKey = `${userId}_${context || "default"}`;

  if (!chatHistories[historyKey]) {
    const selectedPrompt = prompts[context] || prompts.default;
    chatHistories[historyKey] = [selectedPrompt];
  }
  chatHistories[historyKey].push(message);

  // Histórico + Contexto
  const contextToSend = [
    chatHistories[historyKey][0],
    ...chatHistories[historyKey].slice(-10),
  ];

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${CUIDAI_API_KEY}`;

  try {
    const geminiResponse = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: contextToSend.map((msg, i) => ({
          role: i % 2 === 0 ? "user" : "model",
          parts: [{ text: msg }],
        })),
      }),
    });

    const data = await geminiResponse.json();
    const reply =
      data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro na IA.";

    chatHistories[historyKey].push(reply);
    return res.json({ reply });
  } catch (error) {
    logger.error("Erro no servidor:", error);
    return res.status(500).json({ error: "Erro interno." });
  }
});

exports.api = onRequest({ secrets: ["CUIDAI_API_KEY"] }, app);

// ==================================================================
// 🛡️ PARTE 2: SEGURANÇA (Agora em Gen 2 também)
// ==================================================================

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    // ⚠️ PREENCHA AQUI ⚠️
    user: "safeher.appp@gmail.com",
    pass: "iooc fdon qhmn jqrz",
  },
});

exports.monitorarTentativasLogin = onDocumentUpdated(
  "login_attempts/{docId}",
  async (event) => {
    // Na Gen 2, usamos event.data
    if (!event.data) return;

    const dadosNovos = event.data.after.data();
    const dadosAntigos = event.data.before.data();

    // Se o documento foi criado ou deletado (não atualizado), ignoramos
    if (!dadosNovos || !dadosAntigos) return;

    // Lógica: Bateu 5 tentativas agora
    if (dadosNovos.tentativas === 5 && dadosAntigos.tentativas < 5) {
      const emailUsuario = dadosNovos.email;
      const dataHora = new Date().toLocaleString("pt-BR", {
        timeZone: "America/Sao_Paulo",
      });

      logger.info(`ALERTA: Bloqueio iminente para ${emailUsuario}`);

      const mailOptions = {
        from: '"Segurança SafeHer" <safeher.app@gmail.com>',
        to: emailUsuario,
        subject: "🚨 ALERTA DE SEGURANÇA",
        html: `
          <div style="font-family: Arial, color: #333; border: 1px solid #ccc; padding: 20px; border-radius: 8px;">
            <h2 style="color: #c0392b;">Atividade Suspeita</h2>
            <p>Olá,</p>
            <p>Detectamos <strong>3 tentativas falhas de login</strong> na sua conta.</p>
            <p><strong>Data:</strong> ${dataHora}</p>
            <p>Se não foi você, clique abaixo para trocar sua senha imediatamente:</p>
            <br>
            <a href="https://tcc-safeher.web.app/action.html" style="background: #003366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Redefinir Senha</a>
          </div>
        `,
      };

      try {
        await transporter.sendMail(mailOptions);
        logger.info("E-mail de alerta enviado.");
      } catch (err) {
        logger.error("Falha ao enviar e-mail:", err);
      }
    }
  }
);
