import * as Location from "expo-location";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
} from "react-native";
import MapView, { Marker } from "react-native-maps";

export default function MyLocationScreen() {
  const [location, setLocation] =
    useState<Location.LocationObjectCoords | null>(null);

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Permissão negada",
          "Habilite a localização nas configurações do app para usar este recurso."
        );
        return;
      }

      let loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });
      setLocation(loc.coords);
    })();
  }, []);

  const handleShare = async () => {
    if (!location) return;

    const message = `Estou aqui: https://www.google.com/maps/search/?api=1&query=${location.latitude},${location.longitude}`;
    try {
      await Share.share({ message });
    } catch (error) {
      console.log("Erro ao compartilhar localização:", error);
    }
  };

  if (!location) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#D32F2F" />
        <Text style={{ marginTop: 10, color: "#666" }}>
          Obtendo localização...
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        region={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }}
        showsUserLocation={true}
      >
        <Marker
          coordinate={{
            latitude: location.latitude,
            longitude: location.longitude,
          }}
          title="Minha Localização"
          description="Você está aqui"
        />
      </MapView>

      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <Text style={styles.shareText}>📍 Compartilhar Localização</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  shareButton: {
    backgroundColor: "#D32F2F",
    padding: 15,
    borderRadius: 10,
    position: "absolute",
    bottom: 30,
    left: "5%",
    right: "5%",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  shareText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
});
