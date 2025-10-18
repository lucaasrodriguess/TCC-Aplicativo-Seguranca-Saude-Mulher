import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect, useNavigation, useRouter } from "expo-router";
import React, { useContext, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import { DrawerActions } from "@react-navigation/native";
import {
  addDoc,
  collection,
  deleteDoc, // NOVO: Import para deletar
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  updateDoc,
  where,
} from "firebase/firestore";
import { UserContext, UserContextType } from "../../contexts/UserContext";
import { db } from "../../services/firebaseConfig";

interface Cycle {
  id: string;
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

// --- COMPONENTE DE CABEÇALHO PADRÃO ---
const Header = () => {
  const navigation = useNavigation();
  const context = useContext(UserContext) as UserContextType;
  const user = context?.user;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.headerContainer}>
        <TouchableOpacity
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.headerIcon}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saúde e Ciclo</Text>
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

// --- Funções de Lógica (sem alteração na lógica, apenas no nome do arquivo) ---
const formatDateKey = (date: Date): string | null => {
  if (!date || isNaN(new Date(date).getTime())) return null;
  const d = new Date(date);
  return `${d.getFullYear()}-${`0${d.getMonth() + 1}`.slice(
    -2
  )}-${`0${d.getDate()}`.slice(-2)}`;
};

const calculateAverages = (cycles: Cycle[]) => {
  if (cycles.length < 2) {
    return { averageCycleLength: 28, averageMenstruationLength: 5 };
  }
  const sorted = [...cycles].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
  const cycleLengths = sorted.slice(0, -1).map((cycle, i) => {
    const diff = sorted[i + 1].startDate.getTime() - cycle.startDate.getTime();
    return Math.round(diff / 86400000);
  });
  const totalCycle = cycleLengths.reduce((s, l) => s + l, 0);
  const averageCycleLength =
    cycleLengths.length > 0 ? Math.round(totalCycle / cycleLengths.length) : 28;

  const menstruationLengths = sorted
    .filter((c) => c.endDate)
    .map((c) => {
      const diff = c.endDate!.getTime() - c.startDate.getTime();
      return Math.round(diff / 86400000) + 1;
    });
  const totalMenstruation = menstruationLengths.reduce((s, l) => s + l, 0);
  const averageMenstruationLength =
    menstruationLengths.length > 0
      ? Math.round(totalMenstruation / menstruationLengths.length)
      : 5;

  return { averageCycleLength, averageMenstruationLength };
};

const calculateDynamicCyclePhases = (
  cycles: Cycle[]
): Record<string, string> => {
  const phases: Record<string, string> = {};
  if (cycles.length === 0) return phases;
  const { averageCycleLength, averageMenstruationLength } =
    calculateAverages(cycles);
  const sorted = [...cycles].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );

  sorted.forEach((cycle) => {
    const periodEnd =
      cycle.endDate ||
      new Date(
        cycle.startDate.getTime() + (averageMenstruationLength - 1) * 86400000
      );
    for (
      let d = new Date(cycle.startDate);
      d <= periodEnd;
      d.setDate(d.getDate() + 1)
    ) {
      const key = formatDateKey(d);
      if (key) phases[key] = "menstruation";
    }
  });

  const lastCycle = sorted[0];
  for (let i = 1; i <= 6; i++) {
    const futureStart = new Date(
      lastCycle.startDate.getTime() + i * averageCycleLength * 86400000
    );
    for (let j = 0; j < averageMenstruationLength; j++) {
      const day = new Date(futureStart.getTime() + j * 86400000);
      const key = formatDateKey(day);
      if (key) phases[key] = "predicted";
    }
    const ovulationDay = new Date(
      futureStart.getTime() + (averageCycleLength - 14) * 86400000
    );
    for (let j = 0; j <= 5; j++) {
      const fertileDay = new Date(ovulationDay.getTime() - j * 86400000);
      const key = formatDateKey(fertileDay);
      if (key && !phases[key]) phases[key] = "fertile";
    }
    const ovulationKey = formatDateKey(ovulationDay);
    if (ovulationKey) phases[ovulationKey] = "ovulation";
  }
  return phases;
};

// --- Componentes Visuais (com estilos atualizados) ---

const CycleSummary = ({
  cycles,
  averageCycleLength,
}: {
  cycles: Cycle[];
  averageCycleLength: number;
}) => {
  if (cycles.length === 0) {
    return (
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryPlaceholder}>
          Toque no dia de início da sua menstruação para começar.
        </Text>
      </View>
    );
  }
  const lastCycle = cycles[0];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const currentDayOfCycle =
    Math.floor((today.getTime() - lastCycle.startDate.getTime()) / 86400000) +
    1;
  const nextPeriodDate = new Date(
    lastCycle.startDate.getTime() + averageCycleLength * 86400000
  );
  const timeUntilNextPeriod = Math.ceil(
    (nextPeriodDate.getTime() - today.getTime()) / 86400000
  );

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Ionicons name="calendar-outline" size={24} color="#003249" />
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryValue}>{currentDayOfCycle}</Text>
          <Text style={styles.summaryLabel}>Dia do Ciclo</Text>
        </View>
      </View>
      <View style={styles.summaryItem}>
        <Ionicons name="flag-outline" size={24} color="#003249" />
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryValue}>
            {timeUntilNextPeriod >= 0
              ? `${timeUntilNextPeriod} dias`
              : "Atrasada"}
          </Text>
          <Text style={styles.summaryLabel}>Próxima Menstruação</Text>
        </View>
      </View>
    </View>
  );
};

const CalendarGrid = ({
  date,
  onDayPress,
  cyclePhases,
}: {
  date: Date;
  onDayPress: (day: number) => void;
  cyclePhases: Record<string, string>;
}) => {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const todayKey = formatDateKey(new Date());
  const days = Array.from({ length: firstDayOfMonth }, (_, i) => (
    <View key={`e-${i}`} style={styles.dayCell} />
  ));

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dateKey = formatDateKey(dayDate);
    const phase = dateKey ? cyclePhases[dateKey] : undefined;
    const isToday = dateKey === todayKey;

    days.push(
      <TouchableOpacity
        key={day}
        style={[styles.dayCell, phase && styles[phase as keyof typeof styles]]}
        onPress={() => onDayPress(day)}
      >
        <View
          style={
            isToday
              ? styles.todayIndicator
              : {
                  width: 28,
                  height: 28,
                  justifyContent: "center",
                  alignItems: "center",
                }
          }
        >
          <Text
            style={[
              styles.dayText,
              (phase === "ovulation" ||
                phase === "menstruation" ||
                phase === "predicted") &&
                styles.lightText,
            ]}
          >
            {day}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.calendarGrid}>
      {["D", "S", "T", "Q", "Q", "S", "S"].map((day, i) => (
        <Text key={i} style={styles.weekDay}>
          {day}
        </Text>
      ))}
      {days}
    </View>
  );
};

// --- TELA PRINCIPAL ---
export default function HealthScreen() {
  const router = useRouter();
  const { user } = useContext(UserContext) as UserContextType;

  const [currentDate, setCurrentDate] = useState(new Date());
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isLegendVisible, setLegendVisible] = useState(false);
  const [isHistoryVisible, setHistoryVisible] = useState(false);
  const [isNoteModalVisible, setNoteModalVisible] = useState(false);
  const [currentEditingCycle, setCurrentEditingCycle] = useState<Cycle | null>(
    null
  );
  const [noteInput, setNoteInput] = useState("");

  const loadCyclesFromFirebase = async () => {
    if (!user) {
      setCycles([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const q = query(
        collection(db, "users", user.uid, "cycles"),
        orderBy("startDate", "desc")
      );
      const querySnapshot = await getDocs(q);
      const fetchedCycles = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        startDate: doc.data().startDate.toDate(),
        endDate: doc.data().endDate ? doc.data().endDate.toDate() : undefined,
        notes: doc.data().notes,
      }));
      setCycles(fetchedCycles);
    } catch (error) {
      console.error("Erro ao buscar ciclos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      loadCyclesFromFirebase();
    }, [user])
  );

  const { averageCycleLength } = useMemo(
    () => calculateAverages(cycles),
    [cycles]
  );
  const cyclePhases = useMemo(
    () => calculateDynamicCyclePhases(cycles),
    [cycles]
  );

  const handleDayPress = (day: number) => {
    if (!user) return;
    const selectedDate = new Date(
      currentDate.getFullYear(),
      currentDate.getMonth(),
      day
    );
    selectedDate.setHours(0, 0, 0, 0);

    const isAlreadyStartDate = cycles.some(
      (c) => formatDateKey(c.startDate) === formatDateKey(selectedDate)
    );
    if (isAlreadyStartDate) {
      Alert.alert("Data já registrada", "Esta data já é o início de um ciclo.");
      return;
    }

    Alert.alert(
      "Registrar Ciclo",
      `O que deseja fazer com a data ${selectedDate.toLocaleDateString(
        "pt-BR"
      )}?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Marcar Fim da Menstruação",
          onPress: () => markPeriodEnd(selectedDate),
        },
        {
          text: "Marcar Início da Menstruação",
          onPress: () => markPeriodStart(selectedDate),
        },
      ]
    );
  };

  const markPeriodStart = async (date: Date) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "users", user.uid, "cycles"), {
        startDate: date,
        endDate: null,
        notes: "",
      });
      Alert.alert("Sucesso", "Novo ciclo registrado!");
      loadCyclesFromFirebase();
    } catch (error) {
      console.error("Erro ao marcar início:", error);
    }
  };

  const markPeriodEnd = async (date: Date) => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "users", user.uid, "cycles"),
        where("endDate", "==", null),
        orderBy("startDate", "desc"),
        limit(1)
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        Alert.alert("Aviso", "Não há um ciclo em aberto para registrar o fim.");
        return;
      }
      const lastCycleDoc = snapshot.docs[0];
      if (date < lastCycleDoc.data().startDate.toDate()) {
        Alert.alert(
          "Erro",
          "A data de término não pode ser anterior à data de início."
        );
        return;
      }
      await updateDoc(doc(db, "users", user.uid, "cycles", lastCycleDoc.id), {
        endDate: date,
      });
      Alert.alert("Sucesso", "Fim da menstruação registrado!");
      loadCyclesFromFirebase();
    } catch (error) {
      console.error("Erro ao marcar fim:", error);
    }
  };

  // NOVO: Função para deletar um ciclo
  const handleDeleteCycle = (cycle: Cycle) => {
    if (!user) return;
    Alert.alert(
      "Excluir Ciclo",
      `Tem certeza que deseja excluir o ciclo iniciado em ${cycle.startDate.toLocaleDateString(
        "pt-BR"
      )}? Esta ação não pode ser desfeita.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Excluir",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteDoc(doc(db, "users", user.uid, "cycles", cycle.id));
              Alert.alert("Sucesso", "O ciclo foi excluído.");
              loadCyclesFromFirebase(); // Recarrega os dados para recalcular tudo
            } catch (error) {
              console.error("Erro ao deletar ciclo:", error);
              Alert.alert("Erro", "Não foi possível excluir o ciclo.");
            }
          },
        },
      ]
    );
  };

  const handleOpenNoteEditor = (cycle: Cycle) => {
    setCurrentEditingCycle(cycle);
    setNoteInput(cycle.notes || "");
    setNoteModalVisible(true);
  };

  const handleSaveNote = async () => {
    if (!currentEditingCycle || !user) return;
    try {
      await updateDoc(
        doc(db, "users", user.uid, "cycles", currentEditingCycle.id),
        { notes: noteInput }
      );
      setNoteModalVisible(false);
      loadCyclesFromFirebase();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <ScrollView>
        {/* Modals (sem alterações na lógica interna, apenas estilos) */}
        {/* ... (código dos modais aqui, com estilos atualizados) ... */}

        <View style={styles.mainCard}>
          <View style={styles.monthHeader}>
            <TouchableOpacity
              onPress={() =>
                setCurrentDate(
                  new Date(
                    currentDate.getFullYear(),
                    currentDate.getMonth() - 1,
                    1
                  )
                )
              }
            >
              <Ionicons name="chevron-back" size={28} color="#003249" />
            </TouchableOpacity>
            <Text style={styles.monthText}>
              {currentDate.toLocaleString("pt-BR", {
                month: "long",
                year: "numeric",
              })}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <TouchableOpacity
                onPress={() =>
                  setCurrentDate(
                    new Date(
                      currentDate.getFullYear(),
                      currentDate.getMonth() + 1,
                      1
                    )
                  )
                }
              >
                <Ionicons name="chevron-forward" size={28} color="#003249" />
              </TouchableOpacity>
              <TouchableOpacity
                style={{ marginLeft: 8 }}
                onPress={() => setLegendVisible(true)}
              >
                <Ionicons
                  name="information-circle-outline"
                  size={26}
                  color="#003249"
                />
              </TouchableOpacity>
            </View>
          </View>
          <CalendarGrid
            date={currentDate}
            onDayPress={handleDayPress}
            cyclePhases={cyclePhases}
          />
          <View style={styles.divider} />
          <CycleSummary
            cycles={cycles}
            averageCycleLength={averageCycleLength}
          />
        </View>

        <TouchableOpacity
          style={styles.button}
          onPress={() =>
            router.push({
              pathname: "/(main)/cuidai",
              params: { context: "ciclo" },
            })
          }
        >
          <Text style={styles.buttonText}>Fale com a CuidAI 💜</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.buttonSecondary}
          onPress={() => setHistoryVisible(true)}
        >
          <Text style={styles.buttonSecondaryText}>
            Ver Histórico de Ciclos
          </Text>
        </TouchableOpacity>

        {/* ... (CÓDIGO COMPLETO DOS MODAIS) ... */}
        <Modal
          animationType="fade"
          transparent
          visible={isLegendVisible}
          onRequestClose={() => setLegendVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPressOut={() => setLegendVisible(false)}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Legenda</Text>
              {[
                { color: "#FFB6C1", label: "Dias de Menstruação" }, // Rosa claro
                { color: "#98FB98", label: "Período Fértil" }, // Verde claro
                { color: "#ADD8E6", label: "Dia da Ovulação" }, // Azul claro
                { color: "#D3D3D3", label: "Próxima Menstruação" }, // Cinza claro
              ].map((item) => (
                <View key={item.label} style={styles.legendItem}>
                  <View
                    style={[styles.legendDot, { backgroundColor: item.color }]}
                  />
                  <Text style={styles.legendText}>{item.label}</Text>
                </View>
              ))}
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          animationType="slide"
          visible={isHistoryVisible}
          onRequestClose={() => setHistoryVisible(false)}
        >
          <SafeAreaView style={styles.modalPage}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Histórico de Ciclos</Text>
              <TouchableOpacity onPress={() => setHistoryVisible(false)}>
                <Ionicons name="close" size={28} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={cycles}
              keyExtractor={(item) => item.id}
              renderItem={({ item, index }) => {
                const nextCycle = index > 0 ? cycles[index - 1] : null;
                let cycleLen = nextCycle
                  ? Math.round(
                      (nextCycle.startDate.getTime() -
                        item.startDate.getTime()) /
                        86400000
                    )
                  : averageCycleLength;
                return (
                  <View style={styles.historyItem}>
                    <View style={styles.historyHeader}>
                      <View>
                        <Text style={styles.historyDate}>
                          {item.startDate.toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })}
                        </Text>
                        <Text
                          style={styles.historyCycleLength}
                        >{`Duração: ${cycleLen} dias`}</Text>
                      </View>
                      {/* NOVO: BOTÃO DE DELETAR */}
                      <TouchableOpacity
                        style={styles.deleteButton}
                        onPress={() => handleDeleteCycle(item)}
                      >
                        <Ionicons
                          name="trash-outline"
                          size={22}
                          color="#FF6B6B"
                        />
                      </TouchableOpacity>
                    </View>
                    <View style={styles.historyNotesContainer}>
                      <Text style={styles.historyNotes}>
                        {item.notes || "Sem notas."}
                      </Text>
                      <TouchableOpacity
                        onPress={() => handleOpenNoteEditor(item)}
                      >
                        <Text style={styles.editNotesButton}>
                          {item.notes ? "Editar Nota" : "Adicionar Nota"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              }}
            />
          </SafeAreaView>
        </Modal>

        <Modal
          animationType="fade"
          transparent
          visible={isNoteModalVisible}
          onRequestClose={() => setNoteModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Nota do Ciclo</Text>
              <Text style={styles.noteDateLabel}>
                {currentEditingCycle?.startDate.toLocaleDateString("pt-BR", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TextInput
                style={styles.noteInput}
                multiline
                placeholder="Descreva sintomas, fluxo, etc..."
                value={noteInput}
                onChangeText={setNoteInput}
              />
              <View style={styles.noteActions}>
                <TouchableOpacity onPress={() => setNoteModalVisible(false)}>
                  <Text style={styles.noteCancelButton}>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.noteSaveButton}
                  onPress={handleSaveNote}
                >
                  <Text style={styles.noteSaveButtonText}>Salvar</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
}

// --- ESTILOS ATUALIZADOS ---
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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
  },

  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginHorizontal: 16,
    marginTop: 20,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: "#9E9E9E",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  monthHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
    paddingHorizontal: 5,
  },
  monthText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    textTransform: "capitalize",
  },
  calendarGrid: { flexDirection: "row", flexWrap: "wrap" },
  weekDay: {
    width: "14.2%",
    textAlign: "center",
    marginBottom: 10,
    color: "#aaa",
    fontWeight: "bold",
    fontSize: 12,
  },
  dayCell: {
    width: "14.2%",
    height: 38,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 10,
  },
  dayText: { fontSize: 13, fontWeight: "500", color: "#333" },
  lightText: { color: "#fff", fontWeight: "bold" },
  todayIndicator: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderColor: "#003249",
    borderWidth: 2,
  },
  menstruation: { backgroundColor: "#FFB6C1" }, // Rosa claro
  fertile: { backgroundColor: "#98FB98" }, // Verde claro
  ovulation: { backgroundColor: "#ADD8E6" }, // Azul claro
  predicted: { backgroundColor: "#D3D3D3" }, // Cinza claro

  divider: { height: 1, backgroundColor: "#f3f4f6", marginVertical: 20 },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  summaryItem: { flexDirection: "row", alignItems: "center" },
  summaryTextContainer: { marginLeft: 10 },
  summaryValue: { fontSize: 20, fontWeight: "bold", color: "#333" },
  summaryLabel: { fontSize: 12, color: "#666" },
  summaryPlaceholder: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
    flex: 1,
  },

  button: {
    backgroundColor: "#003249",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 24,
    marginHorizontal: 16,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  buttonSecondary: {
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 4,
    marginHorizontal: 16,
    marginBottom: 20,
  },
  buttonSecondaryText: { color: "#003249", fontSize: 16, fontWeight: "bold" },

  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    color: "#333",
  },
  legendItem: { flexDirection: "row", alignItems: "center", marginBottom: 15 },
  legendDot: { width: 14, height: 14, borderRadius: 7, marginRight: 12 },
  legendText: { fontSize: 16, color: "#374151" },

  modalPage: { flex: 1, backgroundColor: "#FAF9F6" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  historyItem: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 12,
    shadowColor: "#a3a3a3",
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  historyHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  }, // NOVO
  historyDate: { fontSize: 16, fontWeight: "bold", color: "#333" },
  historyCycleLength: { fontSize: 14, color: "#6b7280" },
  deleteButton: { padding: 8 }, // NOVO
  historyNotesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  historyNotes: {
    fontSize: 14,
    color: "#374151",
    fontStyle: "italic",
    marginBottom: 8,
  },
  editNotesButton: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#003249",
    textAlign: "right",
  },

  noteDateLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
    textTransform: "capitalize",
  },
  noteInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    borderColor: "#e5e7eb",
    borderWidth: 1,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    fontSize: 16,
  },
  noteActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    marginTop: 20,
  },
  noteCancelButton: { fontSize: 16, color: "#6b7280", marginRight: 24 },
  noteSaveButton: {
    backgroundColor: "#003249",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  noteSaveButtonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
