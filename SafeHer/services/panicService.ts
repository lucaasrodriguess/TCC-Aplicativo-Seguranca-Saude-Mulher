import * as Battery from "expo-battery";
import * as Location from "expo-location";
import * as SMS from "expo-sms";
import { getAuth } from "firebase/auth";
import {
  collection,
  doc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
} from "firebase/firestore";
import { db } from "./firebaseConfig";

// A URL base do seu servidor de rastreamento, a mesma da tela "Minha Localização"
const TRACKING_SERVER_URL = "https://wilful-emlyn-safeher-41c63af9.koyeb.app";

type Contact = { id: string; name: string; phone: string };

/**
 * Dispara a sequência de ações de pânico: ativa o rastreamento no Firestore e envia o link por SMS.
 * @returns {Promise<boolean>} Retorna true se as ações foram concluídas com sucesso.
 */
export const triggerPanicActions = async (): Promise<boolean> => {
  const auth = getAuth();
  const user = auth.currentUser;

  if (!user) {
    alert("Você precisa estar autenticada para usar esta função.");
    console.log("Usuário não autenticado.");
    return false;
  }

  try {
    // 1. Pedir permissões e verificar disponibilidade do SMS
    const { status: locationStatus } =
      await Location.requestForegroundPermissionsAsync();
    const isSmsAvailable = await SMS.isAvailableAsync();

    if (locationStatus !== "granted") {
      alert(
        "Para a função de pânico, é necessário permitir o acesso à sua localização."
      );
      return false;
    }
    if (!isSmsAvailable) {
      alert("Não é possível enviar SMS a partir deste dispositivo.");
      return false;
    }

    // 2. Coletar localização, bateria e contatos de emergência
    const [location, batteryLevel, contacts] = await Promise.all([
      Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      Battery.getBatteryLevelAsync(),
      getEmergencyContacts(),
    ]);

    if (!contacts || contacts.length === 0) {
      alert(
        "Nenhum contato de emergência cadastrado. Adicione contatos na tela de segurança."
      );
      return false;
    }

    // 3. ATIVAR O RASTREAMENTO NO FIREBASE
    // Esta etapa é crucial: ela "liga" a página de rastreamento para que o link funcione imediatamente.
    console.log("Ativando rastreamento em tempo real no Firestore...");
    const locationData = {
      latitude: location.coords.latitude,
      longitude: location.coords.longitude,
      lastUpdated: serverTimestamp(),
      isSharing: true, // Define o status como ativo
      userName: user.displayName || "Usuária",
    };
    const locationDocRef = doc(db, "live_locations", user.uid);
    await setDoc(locationDocRef, locationData, { merge: true });

    // 4. MONTAR A MENSAGEM COM O LINK DE RASTREAMENTO UNIFICADO
    const trackingLink = `${TRACKING_SERVER_URL}/track/${user.uid}`;
    const batteryPercent = Math.round(batteryLevel * 100);
    const message = `${
      user.displayName || "Uma usuária"
    } precisa de ajuda urgente! Acompanhe a localização em tempo real aqui: ${trackingLink} (Bateria: ${batteryPercent}%)`;

    // 5. Enviar SMS para os contatos
    console.log("Enviando SMS com o link de rastreamento...");
    const phoneNumbers = contacts.map((c) => c.phone);
    await SMS.sendSMSAsync(phoneNumbers, message);

    // Futuramente, a gravação de áudio seria iniciada aqui
    // await startAudioRecording();

    return true;
  } catch (error) {
    console.error("Erro ao disparar ações de pânico:", error);
    alert("Um erro inesperado ocorreu. Tente novamente.");
    return false;
  }
};

/**
 * Busca os contatos de emergência do usuário logado no Firestore.
 */
const getEmergencyContacts = async (): Promise<Contact[] | null> => {
  const auth = getAuth();
  const user = auth.currentUser;
  if (!user) return null;

  try {
    const contactsQuery = query(
      collection(db, "users", user.uid, "emergency_contacts")
    );
    const querySnapshot = await getDocs(contactsQuery);
    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Contact, "id">),
    }));
  } catch (error) {
    console.error("Erro ao buscar contatos do Firestore:", error);
    return null;
  }
};
