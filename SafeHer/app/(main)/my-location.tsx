import * as Location from "expo-location";
import { useNavigation } from "expo-router"; // 👈 NOVO: Hook para controlar a navegação/header
import React, { useContext, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker } from "react-native-maps";
import AnimatedRegion from "react-native-maps/lib/AnimatedRegion";
import { io } from "socket.io-client";
import { UserContext, UserContextType } from "../../contexts/UserContext";

const SERVER_URL = "https://wilful-emlyn-safeher-41c63af9.koyeb.app";

export default function MyLocation() {
  const { user } = useContext(UserContext) as UserContextType;
  const navigation = useNavigation(); // Objeto para controlar o cabeçalho da tela

  const [location, setLocation] = useState<{
    latitude: number;
    longitude: number;
  } | null>(null);
  const [region, setRegion] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>("--");
  const markerRef = useRef<Marker>(null);
  const socket = useRef(io(SERVER_URL, { transports: ["websocket"] })).current;

  const animatedCoords = useRef(
    new AnimatedRegion({
      latitude: 0,
      longitude: 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  ).current;

  useEffect(() => {
    if (!user) {
      return;
    }

    // 👇 ALTERAÇÃO PRINCIPAL: Define o título do cabeçalho da tela dinamicamente
    navigation.setOptions({ title: `Localização de ${user.name}` });

    let locationSubscription: Location.LocationSubscription | null = null;

    const startLocationTracking = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão Necessária",
          "Para sua segurança, por favor, habilite o acesso à localização."
        );
        return;
      }

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 3000,
          distanceInterval: 10,
        },
        (locAtualizada) => {
          const { latitude, longitude } = locAtualizada.coords;

          if (!region) {
            // Define a região apenas na primeira vez
            setRegion({
              latitude,
              longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            });
          }

          setLocation({ latitude, longitude });
          setLastUpdate(new Date().toLocaleTimeString());
          animatedCoords
            .timing({ latitude, longitude }, { duration: 1000 })
            .start();
          sendLocation(latitude, longitude, user.uid, user.name);
        }
      );
    };

    startLocationTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [user]);

  const sendLocation = (
    latitude: number,
    longitude: number,
    userId: string,
    userName: string
  ) => {
    if (socket.connected) {
      socket.emit("sendLocation", { userId, userName, latitude, longitude });
    }
  };

  const handleShare = async () => {
    if (!user) return;

    // O link continua usando o ID porque ele é um identificador único e seguro para o backend.
    const trackingLink = `${SERVER_URL}/track/${user.uid}`;
    try {
      await Share.share({
        // 👇 A mensagem agora é personalizada com o nome do usuário
        message: `${user.name} está compartilhando a localização em tempo real para segurança. Acompanhe aqui: ${trackingLink}`,
        title: `Localização de ${user.name} - SAFEHER`,
      });
    } catch (error) {
      Alert.alert("Erro", "Não foi possível compartilhar a localização.");
    }
  };

  if (!region) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#003249" />
        <Text style={styles.loadingText}>
          {!user ? "Carregando perfil..." : "Obtendo sua localização..."}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView style={styles.map} region={region} showsUserLocation>
        {location && user && (
          <Marker.Animated
            ref={markerRef}
            coordinate={animatedCoords}
            // 👇 O título do marcador no mapa também usa o nome do usuário
            title={user.name}
            description={`Atualizado às: ${lastUpdate}`}
          />
        )}
      </MapView>
      <TouchableOpacity
        style={styles.shareButton}
        onPress={handleShare}
        disabled={!user}
      >
        <Text style={styles.shareText}>Compartilhar Localização</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  map: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#555",
  },
  shareButton: {
    position: "absolute",
    bottom: 30,
    left: "5%",
    right: "5%",
    backgroundColor: "#003249",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  shareText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
