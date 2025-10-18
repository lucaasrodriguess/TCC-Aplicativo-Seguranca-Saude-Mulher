import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useCallback, useContext, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { PostModalContext } from "../contexts/PostModalContext";
import { UserContext, UserContextType } from "../contexts/UserContext";

// Importe suas funções do Firebase
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../services/firebaseConfig";

export default function CreatePostModal() {
  const { isPostModalVisible, setPostModalVisible } =
    useContext(PostModalContext);
  const { user } = useContext(UserContext) as UserContextType;

  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isPosting, setIsPosting] = useState(false);

  const resetState = () => {
    setCaption("");
    setSelectedImage(null);
    setIsPosting(false);
  };

  const handleClose = () => {
    resetState();
    setPostModalVisible(false);
  };

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Permissão Necessária",
        "Precisamos de acesso às suas fotos para publicar."
      );
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const uploadImageToStorage = async (uri: string, uid: string) => {
    const blob = await new Promise<Blob>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function (e) {
        reject(new TypeError("Network request failed"));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
    const fileRef = ref(storage, `posts/${uid}/${Date.now()}.jpg`);
    await uploadBytes(fileRef, blob);
    (blob as any).close();
    return getDownloadURL(fileRef);
  };

  const publishPost = useCallback(async () => {
    if (!user || isPosting) return;
    if (!selectedImage && caption.trim().length === 0) {
      Alert.alert(
        "Aviso",
        "Adicione uma foto ou escreva uma legenda para publicar."
      );
      return;
    }
    setIsPosting(true);
    let imageURL = "";
    try {
      if (selectedImage) {
        imageURL = await uploadImageToStorage(selectedImage, user.uid);
      }
      await addDoc(collection(db, "posts"), {
        userId: user.uid,
        userName: user.name,
        userAvatar: user.avatar,
        imageURL: imageURL,
        caption: caption.trim(),
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });
      handleClose(); // Fecha o modal após sucesso
    } catch (error) {
      console.error("Erro ao publicar post:", error);
      Alert.alert("Erro", "Falha ao publicar. Tente novamente.");
      setIsPosting(false); // Permite tentar de novo
    }
  }, [caption, selectedImage, user, isPosting]);

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={isPostModalVisible}
      onRequestClose={handleClose}
    >
      <SafeAreaView style={styles.modalContainer}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
        >
          <View style={styles.header}>
            <Pressable onPress={handleClose}>
              <Ionicons name="close" size={28} color="#333" />
            </Pressable>
            <Text style={styles.title}>Criar Publicação</Text>
            <Pressable
              onPress={publishPost}
              disabled={isPosting || (!caption && !selectedImage)}
            >
              <Text
                style={[
                  styles.publishText,
                  (isPosting || (!caption && !selectedImage)) && {
                    color: "#B0B0B0",
                  },
                ]}
              >
                Publicar
              </Text>
            </Pressable>
          </View>

          <View style={styles.composer}>
            {user?.avatar ? (
              <Image
                source={{ uri: user.avatar }}
                style={styles.composerAvatar}
              />
            ) : (
              <View
                style={[styles.composerAvatar, { backgroundColor: "#eee" }]}
              />
            )}
            <View style={{ flex: 1 }}>
              <TextInput
                placeholder="No que você está pensando?"
                value={caption}
                onChangeText={setCaption}
                style={styles.input}
                placeholderTextColor="#888"
                multiline
              />
              {selectedImage && (
                <Image source={{ uri: selectedImage }} style={styles.preview} />
              )}
              <View style={styles.composerActions}>
                <Pressable onPress={pickImage} style={styles.composerBtn}>
                  <Ionicons name="image-outline" size={22} color="#003249" />
                </Pressable>
              </View>
            </View>
          </View>
          {isPosting && (
            <ActivityIndicator
              style={{ marginTop: 20 }}
              size="large"
              color="#003249"
            />
          )}
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: "#FAF9F6",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#003249",
  },
  publishText: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#FF6B6B",
  },
  composer: {
    flexDirection: "row",
    gap: 12,
    padding: 16,
  },
  composerAvatar: { width: 40, height: 40, borderRadius: 20 },
  input: {
    fontSize: 18,
    minHeight: 100,
    color: "#333",
    textAlignVertical: "top",
  },
  preview: {
    marginTop: 12,
    width: "100%",
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: "#eee",
  },
  composerActions: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
  },
  composerBtn: {
    padding: 8,
  },
});
