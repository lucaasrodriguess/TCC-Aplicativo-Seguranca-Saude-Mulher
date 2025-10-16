import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Image,
    Pressable,
    SafeAreaView,
    StyleSheet,
    Text,
    View,
} from "react-native";

type Props = {
  name?: string;
  avatarUri?: string;
  onMenuPress?: () => void;
  onProfilePress?: () => void;
};

const Header: React.FC<Props> = ({
  name = "Maria",
  avatarUri = "https://i.pravatar.cc/100?img=5", // avatar fake da web
  onMenuPress,
  onProfilePress,
}) => {
  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Botão de menu hambúrguer */}
        <Pressable onPress={onMenuPress} style={styles.menuBtn}>
          <Ionicons name="menu" size={28} color="#fff" />
        </Pressable>

        {/* Texto de boas-vindas */}
        <Text numberOfLines={1} style={styles.title}>
          Bem-vinda, {name}!
        </Text>

        {/* Avatar como botão de perfil */}
        <Pressable onPress={onProfilePress} style={styles.avatarBtn}>
          <Image source={{ uri: avatarUri }} style={styles.avatar} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

export default Header;

const styles = StyleSheet.create({
  safe: { backgroundColor: "#d31aff" },
  container: {
    height: 72,
    backgroundColor: "#d31aff",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  menuBtn: { padding: 6, marginRight: 8 },
  title: { flex: 1, color: "#fff", fontSize: 18, fontWeight: "700" },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#fff",
  },
});
