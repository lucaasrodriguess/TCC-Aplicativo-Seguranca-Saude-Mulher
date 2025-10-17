import { Ionicons } from "@expo/vector-icons";
import { useRouter, useFocusEffect } from "expo-router";
import React, { useMemo, useState, useContext } from "react";
import {
  Alert,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  ActivityIndicator,
  Platform,
} from "react-native";

// Importações do Firebase e do Contexto do Usuário
import { db } from "../../services/firebaseConfig"; // ATENÇÃO: Verifique se este caminho está correto
import { UserContext, UserContextType } from "../../contexts/UserContext"; // ATENÇÃO: Verifique se este caminho está correto
import {
  collection,
  query,
  orderBy,
  getDocs,
  addDoc,
  doc,
  updateDoc,
  where,
  limit,
} from "firebase/firestore";

interface Cycle {
  id: string; // ID do documento do Firestore
  startDate: Date;
  endDate?: Date;
  notes?: string;
}

const formatDateKey = (date: Date): string | null => {
  if (!date || isNaN(new Date(date).getTime())) {
    return null;
  }
  const d = new Date(date);
  const year = d.getFullYear();
  const month = `0${d.getMonth() + 1}`.slice(-2);
  const day = `0${d.getDate()}`.slice(-2);
  return `${year}-${month}-${day}`;
};

const calculateAverages = (cycles: Cycle[]) => {
  if (cycles.length < 2) {
    return { averageCycleLength: 28, averageMenstruationLength: 5 };
  }
  const sortedCycles = [...cycles].sort(
    (a, b) => a.startDate.getTime() - b.startDate.getTime()
  );
  const cycleLengths: number[] = [];
  for (let i = 0; i < sortedCycles.length - 1; i++) {
    const diff =
      sortedCycles[i + 1].startDate.getTime() -
      sortedCycles[i].startDate.getTime();
    cycleLengths.push(Math.round(diff / (1000 * 60 * 60 * 24)));
  }
  const totalCycleLength = cycleLengths.reduce((sum, len) => sum + len, 0);
  const averageCycleLength =
    cycleLengths.length > 0
      ? Math.round(totalCycleLength / cycleLengths.length)
      : 28;
  const menstruationLengths = sortedCycles
    .filter((c) => c.endDate)
    .map((c) => {
      const diff = c.endDate!.getTime() - c.startDate.getTime();
      return Math.round(diff / (1000 * 60 * 60 * 24)) + 1;
    });
  const totalMenstruationLength = menstruationLengths.reduce(
    (sum, len) => sum + len,
    0
  );
  const averageMenstruationLength =
    menstruationLengths.length > 0
      ? Math.round(totalMenstruationLength / menstruationLengths.length)
      : 5;
  return { averageCycleLength, averageMenstruationLength };
};

const calculateDynamicCyclePhases = (
  cycles: Cycle[],
  defaultCycleLength: number = 28,
  defaultMenstruationLength: number = 5
): Record<string, string> => {
  const phases: Record<string, string> = {};
  if (cycles.length === 0) return phases;

  const { averageCycleLength, averageMenstruationLength } =
    calculateAverages(cycles);

  const cycleLength = averageCycleLength || defaultCycleLength;
  const menstruationLength =
    averageMenstruationLength || defaultMenstruationLength;

  const sortedCycles = [...cycles].sort(
    (a, b) => b.startDate.getTime() - a.startDate.getTime()
  );

  sortedCycles.forEach((cycle) => {
    const periodEnd =
      cycle.endDate ||
      new Date(
        cycle.startDate.getTime() +
          (menstruationLength - 1) * 24 * 60 * 60 * 1000
      );
    let currentDate = new Date(cycle.startDate);
    while (currentDate <= periodEnd) {
      const key = formatDateKey(currentDate);
      if (key) phases[key] = "menstruation";
      currentDate.setDate(currentDate.getDate() + 1);
    }
  });

  const lastCycle = sortedCycles[0];
  for (let i = 1; i <= 6; i++) {
    const cycleStartDate = new Date(lastCycle.startDate);
    cycleStartDate.setDate(cycleStartDate.getDate() + i * cycleLength);

    for (let j = 0; j < menstruationLength; j++) {
      const day = new Date(cycleStartDate);
      day.setDate(day.getDate() + j);
      const key = formatDateKey(day);
      if (key) phases[key] = "predicted";
    }

    const ovulationDay = new Date(cycleStartDate);
    ovulationDay.setDate(ovulationDay.getDate() + cycleLength - 14);

    for (let j = 0; j <= 5; j++) {
      const fertileDay = new Date(ovulationDay);
      fertileDay.setDate(fertileDay.getDate() - j);
      const key = formatDateKey(fertileDay);
      if (key && !phases[key]) {
        phases[key] = "fertile";
      }
    }

    const ovulationKey = formatDateKey(ovulationDay);
    if (ovulationKey) {
      phases[ovulationKey] = "ovulation";
    }
  }

  return phases;
};

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
  const diffTime = Math.max(0, today.getTime() - lastCycle.startDate.getTime());
  const currentDayOfCycle = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;

  const nextPeriodDate = new Date(lastCycle.startDate);
  nextPeriodDate.setDate(nextPeriodDate.getDate() + averageCycleLength);
  const timeUntilNextPeriod = Math.ceil(
    (nextPeriodDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <View style={styles.summaryContainer}>
      <View style={styles.summaryItem}>
        <Ionicons name="calendar-outline" size={24} color="#581c87" />
        <View style={styles.summaryTextContainer}>
          <Text style={styles.summaryValue}>{currentDayOfCycle}</Text>
          <Text style={styles.summaryLabel}>Dia do Ciclo</Text>
        </View>
      </View>
      <View style={styles.summaryItem}>
        <Ionicons name="flag-outline" size={24} color="#581c87" />
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

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dayDate = new Date(year, month, day);
    const dateKey = formatDateKey(dayDate);
    const phase = dateKey ? cyclePhases[dateKey] : undefined;
    const isToday = dateKey === todayKey;

    // A CORREÇÃO FINAL PARA O ERRO DE TIPAGEM
    const styleArray = [styles.dayCell];
    const phaseStyle = styles[phase as keyof typeof styles];
    if (phaseStyle) {
      styleArray.push(phaseStyle);
    }

    days.push(
      <TouchableOpacity
        key={day}
        style={styleArray}
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

export default function CycleScreen() {
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
      setCycles([]); // Limpa os ciclos se o usuário deslogar
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const cyclesCollectionRef = collection(db, "users", user.uid, "cycles");
      const q = query(cyclesCollectionRef, orderBy("startDate", "desc"));
      const querySnapshot = await getDocs(q);
      const fetchedCycles: Cycle[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedCycles.push({
          id: doc.id,
          startDate: data.startDate.toDate(),
          endDate: data.endDate ? data.endDate.toDate() : undefined,
          notes: data.notes,
        });
      });
      setCycles(fetchedCycles);
    } catch (error) {
      console.error("Erro ao buscar ciclos:", error);
      Alert.alert("Erro", "Não foi possível carregar o histórico de ciclos.");
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
    if (!user)
      return Alert.alert(
        "Aviso",
        "Você precisa estar logado para registrar seu ciclo."
      );

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
      Alert.alert(
        "Data já registrada",
        "Esta data já está marcada como o início de um ciclo."
      );
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
          onPress: async () => {
            if (!user) return;
            try {
              const cyclesCollectionRef = collection(
                db,
                "users",
                user.uid,
                "cycles"
              );
              const q = query(
                cyclesCollectionRef,
                where("endDate", "==", null),
                orderBy("startDate", "desc"),
                limit(1)
              );
              const querySnapshot = await getDocs(q);

              if (querySnapshot.empty) {
                Alert.alert(
                  "Aviso",
                  "Não há um ciclo em aberto para registrar o fim."
                );
                return;
              }

              const lastCycleDoc = querySnapshot.docs[0];
              const lastCycleStartDate = lastCycleDoc.data().startDate.toDate();

              if (selectedDate < lastCycleStartDate) {
                Alert.alert(
                  "Erro",
                  "A data de término não pode ser anterior à data de início."
                );
                return;
              }

              await updateDoc(
                doc(db, "users", user.uid, "cycles", lastCycleDoc.id),
                { endDate: selectedDate }
              );
              Alert.alert("Sucesso", "Fim da menstruação registrado!");
              loadCyclesFromFirebase();
            } catch (error) {
              console.error("Erro ao marcar fim do ciclo:", error);
            }
          },
        },
        {
          text: "Marcar Início da Menstruação",
          onPress: async () => {
            if (!user) return;
            try {
              const cyclesCollectionRef = collection(
                db,
                "users",
                user.uid,
                "cycles"
              );
              await addDoc(cyclesCollectionRef, {
                startDate: selectedDate,
                endDate: null,
                notes: "",
              });
              Alert.alert("Sucesso", "Novo ciclo registrado!");
              loadCyclesFromFirebase();
            } catch (error) {
              console.error("Erro ao marcar início do ciclo:", error);
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
      const cycleDocRef = doc(
        db,
        "users",
        user.uid,
        "cycles",
        currentEditingCycle.id
      );
      await updateDoc(cycleDocRef, { notes: noteInput });
      setNoteModalVisible(false);
      loadCyclesFromFirebase();
    } catch (error) {
      console.error("Erro ao salvar nota:", error);
    }
  };

  if (isLoading) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          backgroundColor: "#f8f7ff",
        }}
      >
        <ActivityIndicator size="large" color="#581c87" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Modal
        animationType="fade"
        transparent={true}
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
              { color: "#eab3b7", label: "Dias de Menstruação" },
              { color: "#d1fae5", label: "Período Fértil" },
              { color: "#d8b4fe", label: "Dia da Ovulação" },
              { color: "#e5e7eb", label: "Próxima Menstruação (Previsão)" },
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
        <View style={styles.modalPage}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Histórico de Ciclos</Text>
            <TouchableOpacity onPress={() => setHistoryVisible(false)}>
              <Ionicons name="close" size={28} color="#333" />
            </TouchableOpacity>
          </View>
          <FlatList
            data={cycles}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item, index }) => {
              const nextCycle = index > 0 ? cycles[index - 1] : null;
              let currentCycleLength = averageCycleLength;
              if (nextCycle) {
                const diff =
                  nextCycle.startDate.getTime() - item.startDate.getTime();
                currentCycleLength = Math.round(diff / (1000 * 60 * 60 * 24));
              }

              return (
                <View style={styles.historyItem}>
                  <View style={styles.historyDateContainer}>
                    <Text style={styles.historyDate}>
                      {item.startDate.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </Text>
                    <Text
                      style={styles.historyCycleLength}
                    >{`Duração: ${currentCycleLength} dias`}</Text>
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
        </View>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
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

      <View style={styles.header}>
        <Text style={styles.title}>Ciclo Menstrual</Text>
      </View>

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
            <Ionicons name="chevron-back" size={28} color="#581c87" />
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
              <Ionicons name="chevron-forward" size={28} color="#581c87" />
            </TouchableOpacity>
            <TouchableOpacity
              style={{ marginLeft: 8 }}
              onPress={() => setLegendVisible(true)}
            >
              <Ionicons
                name="information-circle-outline"
                size={26}
                color="#581c87"
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
        <CycleSummary cycles={cycles} averageCycleLength={averageCycleLength} />
      </View>
      <TouchableOpacity
        style={styles.button}
        onPress={() => router.push("../cuidai")}
      >
        <Text style={styles.buttonText}>Fale com a CuidAI 💜</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.buttonSecondary}
        onPress={() => setHistoryVisible(true)}
      >
        <Text style={styles.buttonSecondaryText}>Ver Histórico de Ciclos</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

// ESTILOS COMPLETOS E REFINADOS
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    paddingTop: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
    paddingTop: Platform.OS === "ios" ? 0 : 20, // Padding extra para Android
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#333",
  },
  mainCard: {
    backgroundColor: "#fff",
    borderRadius: 24,
    marginHorizontal: 16,
    paddingVertical: 20,
    paddingHorizontal: 15,
    shadowColor: "#a3a3a3",
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 5 },
    elevation: 8,
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
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
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
  dayText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#333",
  },
  lightText: {
    color: "#fff",
    fontWeight: "bold",
  },
  todayIndicator: {
    width: 28,
    height: 28,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 14,
    borderColor: "#581c87",
    borderWidth: 2,
  },
  menstruation: { backgroundColor: "#eab3b7" },
  fertile: { backgroundColor: "#d1fae5" },
  ovulation: { backgroundColor: "#d8b4fe" },
  predicted: { backgroundColor: "#e5e7eb" },
  divider: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginVertical: 20,
  },
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  summaryItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  summaryTextContainer: {
    marginLeft: 10,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  summaryLabel: {
    fontSize: 12,
    color: "#666",
  },
  summaryPlaceholder: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    fontStyle: "italic",
    flex: 1,
  },
  button: {
    backgroundColor: "#581c87",
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
  buttonSecondaryText: {
    color: "#581c87",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  legendDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    marginRight: 12,
  },
  legendText: {
    fontSize: 16,
    color: "#374151",
  },
  modalPage: {
    flex: 1,
    backgroundColor: "#f8f7ff",
    paddingTop: 50,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
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
  historyDateContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  historyDate: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
  },
  historyCycleLength: {
    fontSize: 14,
    color: "#6b7280",
  },
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
    color: "#581c87",
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
  noteCancelButton: {
    fontSize: 16,
    color: "#6b7280",
    marginRight: 24,
  },
  noteSaveButton: {
    backgroundColor: "#581c87",
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  noteSaveButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
