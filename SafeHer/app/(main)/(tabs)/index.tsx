import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
// ADICIONADO: useRef para estabilizar o estado de likes
import React, {
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import {
  Menu,
  MenuOption,
  MenuOptions,
  MenuTrigger,
} from "react-native-popup-menu";
import { UserContext, UserContextType } from "../../../contexts/UserContext";

// --- IMPORTS DO FIREBASE ---
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import { db, storage } from "../../../services/firebaseConfig"; // ATUALIZE ESTE CAMINHO SE NECESSÁRIO

// --- TIPOS E DADOS ---

export type Comment = {
  id: string; // ID do documento no Firestore
  user: { name: string; avatar: string };
  text: string;
  createdAt: string; // Para o tempo de exibição
};

export type Post = {
  id: string;
  user: { name: string; avatar: string };
  imageURL: string;
  caption: string;
  likes: number;
  liked: boolean; // Estado local para o coração
  createdAt: string;
  commentsCount: number;
};

// --- FUNÇÃO AUXILIAR ---
function timeSince(date: Date) {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  const intervals: [number, string][] = [
    [31536000, "ano"],
    [2592000, "mês"],
    [604800, "semana"],
    [86400, "dia"],
    [3600, "hora"],
    [60, "min"],
  ];
  for (const [s, label] of intervals) {
    const v = Math.floor(seconds / s);
    if (v >= 1) return `há ${v} ${label}${v > 1 && label !== "min" ? "s" : ""}`;
  }
  return "agora";
}

// --- COMPONENTES VISUAIS ---

const Header = () => {
  const router = useRouter();
  const context = useContext(UserContext) as UserContextType;
  const user = context?.user;
  const userName = user?.name || "Usuária";

  const handleLogout = () => {
    if (context.logout) {
      context.logout();
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Menu>
          <MenuTrigger style={styles.menuBtn}>
            <Ionicons name="menu" size={28} color="#fff" />
          </MenuTrigger>

          <MenuOptions
            customStyles={{
              optionsContainer: {
                marginTop: 40,
                borderRadius: 8,
                padding: 5,
              },
            }}
          >
            <MenuOption onSelect={() => router.push("/(main)/profile")}>
              <View style={styles.menuOption}>
                <Ionicons name="person-circle-outline" size={20} color="#333" />
                <Text style={styles.menuOptionText}>Ver Perfil</Text>
              </View>
            </MenuOption>
            <MenuOption onSelect={handleLogout}>
              <View style={styles.menuOption}>
                <Ionicons name="log-out-outline" size={20} color="#d9534f" />
                <Text style={[styles.menuOptionText, { color: "#d9534f" }]}>
                  Sair
                </Text>
              </View>
            </MenuOption>
          </MenuOptions>
        </Menu>
        <Text numberOfLines={1} style={styles.title}>
          Bem-vinda, {userName}!
        </Text>
        <View style={{ width: 40 }} />
      </View>
    </SafeAreaView>
  );
};

const PostCard = ({
  post,
  onToggleLike,
  onCommentPress,
  onPostOptions,
}: {
  post: Post;
  onToggleLike: (id: string) => void;
  onCommentPress: (postId: string) => void;
  onPostOptions: (postId: string) => void;
}) => {
  const timeAgo = timeSince(new Date(post.createdAt));
  const commentCount = post.commentsCount;

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        <Image source={{ uri: post.user.avatar }} style={styles.postAvatar} />
        <Text style={styles.postUser} numberOfLines={1}>
          {post.user.name}
        </Text>
        <Pressable
          onPress={() => onPostOptions(post.id)}
          style={styles.iconBtn}
        >
          <Ionicons name="ellipsis-vertical" size={18} color="#222" />
        </Pressable>
      </View>
      {post.imageURL ? (
        <Image source={{ uri: post.imageURL }} style={styles.postImage} />
      ) : null}
      <View style={styles.actionsRow}>
        <Pressable onPress={() => onToggleLike(post.id)} style={styles.iconBtn}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={26}
            // COR CORRETA: Roxo (#9C6ADE) quando curtido
            color={post.liked ? "#9C6ADE" : "#222"}
          />
        </Pressable>
        <Pressable
          onPress={() => onCommentPress(post.id)}
          style={styles.iconBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={26} color="#222" />
        </Pressable>
        <Pressable style={styles.iconBtn}>
          <Ionicons name="paper-plane-outline" size={26} color="#222" />
        </Pressable>
        <View style={{ flex: 1 }} />
        <Pressable style={styles.iconBtn}>
          <Ionicons name="bookmark-outline" size={26} color="#222" />
        </Pressable>
      </View>
      <Text style={styles.likes}>{post.likes} curtidas</Text>
      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{post.user.name} </Text>
          {post.caption}
        </Text>
      ) : null}

      {commentCount > 0 && (
        <Pressable onPress={() => onCommentPress(post.id)}>
          <Text style={styles.commentCountText}>
            {`Ver todos os ${commentCount} comentários`}
          </Text>
        </Pressable>
      )}
      <Text style={styles.time}>{timeAgo}</Text>
    </View>
  );
};

const ListHeader = ({
  caption,
  onCaptionChange,
  selectedImage,
  onPickImage,
  onPublishPost,
  isPosting,
}: {
  caption: string;
  onCaptionChange: (text: string) => void;
  selectedImage: string | null;
  onPickImage: () => void;
  onPublishPost: () => Promise<void>;
  isPosting: boolean;
}) => {
  const context = useContext(UserContext) as UserContextType;
  const userAvatar = context?.user?.avatar || "https://i.pravatar.cc/100?img=5";

  return (
    <View style={styles.composer}>
      <Image source={{ uri: userAvatar }} style={styles.composerAvatar} />
      <View style={{ flex: 1 }}>
        <TextInput
          placeholder="No que você está pensando?"
          value={caption}
          onChangeText={onCaptionChange}
          style={styles.input}
          placeholderTextColor="#777"
        />
        {selectedImage && (
          <Image source={{ uri: selectedImage }} style={styles.preview} />
        )}
        <View style={styles.composerActions}>
          <Pressable onPress={onPickImage} style={styles.composerBtn}>
            <Ionicons name="image-outline" size={18} color="#9C6ADE" />
            <Text style={styles.composerBtnText}>Foto</Text>
          </Pressable>
          <View style={{ flex: 1 }} />
          <Pressable
            onPress={onPublishPost}
            style={[styles.publishBtn, isPosting && { opacity: 0.6 }]}
            disabled={isPosting}
          >
            {isPosting ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.publishText}>Publicar</Text>
            )}
          </Pressable>
        </View>
      </View>
    </View>
  );
};

const CommentsModal = ({
  post,
  isVisible,
  onClose,
  onAddComment,
  isLoadingComments,
}: {
  post: (Post & { comments: Comment[] }) | null;
  isVisible: boolean;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => Promise<void>;
  isLoadingComments: boolean;
}) => {
  const [commentText, setCommentText] = useState("");
  const context = useContext(UserContext) as UserContextType;
  const userAvatar = context?.user?.avatar || "https://i.pravatar.cc/100?img=5";
  const [isSending, setIsSending] = useState(false);

  const handleSendComment = async () => {
    if (post && commentText.trim().length > 0) {
      setIsSending(true);
      try {
        await onAddComment(post.id, commentText.trim());
        setCommentText("");
      } catch (error) {
        // Erro tratado na função principal, apenas limpa o estado
      } finally {
        setIsSending(false);
      }
    }
  };

  return (
    <Modal
      animationType="slide"
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>Comentários</Text>
          <Pressable onPress={onClose}>
            <Ionicons name="close" size={28} color="#333" />
          </Pressable>
        </View>

        {isLoadingComments ? (
          <ActivityIndicator
            size="large"
            color="#9C6ADE"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={post?.comments || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <View style={styles.commentItem}>
                <Image
                  source={{ uri: item.user.avatar }}
                  style={styles.commentAvatar}
                />
                <View style={styles.commentContent}>
                  <Text style={styles.commentUser}>{item.user.name}</Text>
                  <Text style={styles.commentText}>{item.text}</Text>
                  <Text style={styles.timeSmall}>
                    {timeSince(new Date(item.createdAt))}
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyCommentsText}>
                Seja o primeiro a comentar!
              </Text>
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <View style={styles.commentInputContainer}>
            <Image source={{ uri: userAvatar }} style={styles.commentAvatar} />
            <TextInput
              placeholder="Adicione um comentário..."
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              editable={!isSending}
            />
            <Pressable
              onPress={handleSendComment}
              style={styles.sendButton}
              disabled={isSending}
            >
              {isSending ? (
                <ActivityIndicator color="#9C6ADE" size="small" />
              ) : (
                <Ionicons
                  name="arrow-up-circle"
                  size={32}
                  color={commentText.trim() ? "#9C6ADE" : "#ccc"}
                />
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
};

// --- COMPONENTE PRINCIPAL DA TELA ---
export default function Home() {
  const context = useContext(UserContext) as UserContextType;
  const user = context?.user;

  const [posts, setPosts] = useState<Post[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [caption, setCaption] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<
    (Post & { comments: Comment[] }) | null
  >(null);
  const [isPosting, setIsPosting] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);

  // CRÍTICO: userLikes agora é um useRef para não causar re-execuções desnecessárias no useEffect
  const userLikesRef = useRef(new Set<string>());

  const [_, setForceUpdate] = useState(0);

  // --- LÓGICA DE BUSCA INICIAL DE LIKES (useCallback) ---
  const fetchUserLikes = useCallback(async () => {
    if (!user || !user.uid) return;
    try {
      const allPostsSnapshot = await getDocs(collection(db, "posts"));
      const likedPostIds = new Set<string>();

      for (const postDoc of allPostsSnapshot.docs) {
        const userLikeRef = doc(db, "posts", postDoc.id, "likes", user.uid);
        const userLikeDoc = await getDoc(userLikeRef);

        if (userLikeDoc.exists()) {
          likedPostIds.add(postDoc.id);
        }
      }
      // ATUALIZA O VALOR DO REF, não o estado reativo
      userLikesRef.current = likedPostIds;
    } catch (e) {
      console.error("Erro ao buscar likes iniciais:", e);
    }
  }, [user]);

  // --- LÓGICA DE BUSCA EM TEMPO REAL (FIRESTORE) CORRIGIDA ---
  useEffect(() => {
    if (!user) return;

    // 1. CHAMA A BUSCA INICIAL: Popula userLikesRef
    fetchUserLikes();

    // 2. Define a consulta: ordenar por 'createdAt' decrescente e limitar a 50
    const postsQuery = query(
      collection(db, "posts"),
      orderBy("createdAt", "desc"),
      limit(50)
    );

    // 3. Listener para os posts (em tempo real)
    const unsubscribePosts = onSnapshot(
      postsQuery,
      (snapshot) => {
        const newPosts: Post[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          const postId = doc.id;

          // AQUI USAMOS O VALOR ATUALIZADO NO REF, que é sempre estável
          const liked = userLikesRef.current.has(postId);

          return {
            id: postId,
            user: { name: data.userName, avatar: data.userAvatar },
            imageURL: data.imageURL,
            caption: data.caption,
            likes: data.likes || 0,
            liked: liked,
            commentsCount: data.commentsCount || 0,
            createdAt:
              data.createdAt?.toDate().toISOString() ||
              new Date().toISOString(),
          } as Post;
        });

        setPosts(newPosts);
        setRefreshing(false);
      },
      (error) => {
        console.error("Erro ao buscar posts:", error);
        setRefreshing(false);
        Alert.alert("Erro de Conexão", "Não foi possível carregar o feed.");
      }
    );

    return () => unsubscribePosts();
    // userLikes removido das dependências para eliminar o re-scan
  }, [user, fetchUserLikes]);

  // --- FUNÇÕES DE UTILITY DO FIREBASE/STORAGE ---
  const uploadImageToStorage = async (uri: string, uid: string) => {
    const blob = await new Promise((resolve, reject) => {
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
    await uploadBytes(fileRef, blob as any);
    (blob as any).close();
    return getDownloadURL(fileRef);
  };

  // --- LÓGICA DE PUBLICAR POST ---
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
    let imageURL = selectedImage || "";

    try {
      if (selectedImage) {
        imageURL = await uploadImageToStorage(selectedImage, user.uid);
      }

      await addDoc(collection(db, "posts"), {
        userUid: user.uid,
        userName: user.name,
        userAvatar: user.avatar,
        imageURL: imageURL,
        caption: caption.trim(),
        likes: 0,
        commentsCount: 0,
        createdAt: serverTimestamp(),
      });

      setCaption("");
      setSelectedImage(null);

      Alert.alert("Sucesso", "Sua postagem foi publicada!");
    } catch (error) {
      console.error("Erro ao publicar post:", error);
      Alert.alert(
        "Erro",
        "Falha ao publicar. Verifique sua conexão ou tente novamente."
      );
    } finally {
      setIsPosting(false);
    }
  }, [caption, selectedImage, user, isPosting]);

  // --- LÓGICA DE CURTIR (LIKE/UNLIKE) ÚNICO CORRIGIDA PARA FLUIDEZ ---
  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) {
        Alert.alert("Erro", "Você precisa estar logado para curtir.");
        return;
      }

      const isCurrentlyLiked = userLikesRef.current.has(postId); // Usa o REF
      const postRef = doc(db, "posts", postId);
      const userLikeRef = doc(db, "posts", postId, "likes", user.uid);
      const change = isCurrentlyLiked ? -1 : 1;

      // 1. Otimista: Atualiza o REF (valor não reativo)
      if (isCurrentlyLiked) {
        userLikesRef.current.delete(postId);
      } else {
        userLikesRef.current.add(postId);
      }

      // CORREÇÃO CRÍTICA DO PROBLEMA DO "PISCAR" (Atualiza o estado visual e a contagem)
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !p.liked, likes: p.likes + change }
            : p
        )
      );

      // Força o re-render APÓS a atualização do REF e do setPosts
      setForceUpdate((prev) => prev + 1);

      try {
        // 2. Persiste a mudança no Firestore
        if (isCurrentlyLiked) {
          await deleteDoc(userLikeRef);
        } else {
          await setDoc(userLikeRef, {
            userUid: user.uid,
            createdAt: serverTimestamp(),
          });
        }

        // 3. Atualiza a contagem de likes no post principal
        await updateDoc(postRef, {
          likes: increment(change),
        });
      } catch (error) {
        console.error("Erro ao curtir post:", error);
        Alert.alert("Erro", "Não foi possível curtir no momento.");

        // 4. Reverte o estado local em caso de falha crítica (usando o REF)
        if (isCurrentlyLiked) {
          userLikesRef.current.add(postId);
        } else {
          userLikesRef.current.delete(postId);
        }
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, liked: isCurrentlyLiked, likes: p.likes - change }
              : p
          )
        );
        setForceUpdate((prev) => prev + 1);
      }
    },
    [user] // Apenas user como dependência, garantindo estabilidade
  );

  // --- LÓGICA DE COMENTÁRIOS ---

  const handleLoadComments = useCallback(
    async (postId: string) => {
      setIsLoadingComments(true);
      try {
        const commentsQuery = query(
          collection(db, "posts", postId, "comments"),
          orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(commentsQuery);

        const comments: Comment[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            user: { name: data.userName, avatar: data.userAvatar },
            text: data.text,
            createdAt:
              data.createdAt?.toDate().toISOString() ||
              new Date().toISOString(),
          } as Comment;
        });

        const post = posts.find((p) => p.id === postId);
        if (post) {
          setSelectedPost({ ...post, comments });
        }
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
        Alert.alert("Erro", "Não foi possível carregar os comentários.");
        setSelectedPost(null);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [posts]
  );

  const handleCommentPress = useCallback(
    async (postId: string) => {
      await handleLoadComments(postId);
      setIsCommentsVisible(true);
    },
    [handleLoadComments]
  );

  const handleAddComment = useCallback(
    async (postId: string, commentText: string) => {
      if (!user) {
        Alert.alert("Erro", "Você precisa estar logado para comentar.");
        return;
      }

      const newCommentData = {
        userName: user.name,
        userAvatar: user.avatar,
        userUid: user.uid,
        text: commentText,
        createdAt: serverTimestamp(),
      };

      try {
        // 1. Adiciona o comentário na subcoleção 'comments'
        await addDoc(
          collection(db, "posts", postId, "comments"),
          newCommentData
        );

        // 2. Incrementa a contagem de comentários no post principal
        await updateDoc(doc(db, "posts", postId), {
          commentsCount: increment(1),
        });

        // 3. Recarrega os comentários para atualizar o modal
        await handleLoadComments(postId);
      } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
        Alert.alert("Erro", "Não foi possível salvar o comentário.");
      }
    },
    [user, handleLoadComments]
  );

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
      quality: 0.9,
      allowsEditing: false,
    });
    if (!result.canceled) {
      setSelectedImage(result.assets[0].uri);
    }
  }, []);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Ao atualizar, re-busca os likes do usuário
    fetchUserLikes();
  }, [fetchUserLikes]);

  const handlePostOptions = useCallback((postId: string) => {
    Alert.alert("Opções da Publicação", "O que você gostaria de fazer?", [
      {
        text: "Denunciar",
        onPress: () =>
          Alert.alert(
            "Denúncia Recebida",
            "Obrigado por nos ajudar a manter a comunidade segura."
          ),
        style: "destructive",
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }, []);

  if (!user) {
    return (
      <SafeAreaView style={styles.appContainer}>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color="#9C6ADE" />
          <Text style={{ marginTop: 10, color: "#666" }}>
            Carregando dados do usuário...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#9C6ADE" />
      <Header />
      <FlatList
        // O estado do FlatList agora é reativo a setPosts e setForceUpdate
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            onToggleLike={toggleLike}
            onCommentPress={handleCommentPress}
            onPostOptions={handlePostOptions}
          />
        )}
        contentContainerStyle={styles.feedContentContainer}
        ListHeaderComponent={
          <ListHeader
            caption={caption}
            onCaptionChange={setCaption}
            selectedImage={selectedImage}
            onPickImage={pickImage}
            onPublishPost={publishPost}
            isPosting={isPosting}
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#9C6ADE"
          />
        }
        onEndReachedThreshold={0.2}
      />

      <CommentsModal
        post={selectedPost}
        isVisible={isCommentsVisible}
        onClose={() => setIsCommentsVisible(false)}
        onAddComment={handleAddComment}
        isLoadingComments={isLoadingComments}
      />
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#f7f7f7" },
  safe: { backgroundColor: "#9C6ADE" },
  headerContainer: {
    height: 72,
    backgroundColor: "#9C6ADE",
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: Platform.OS === "android" ? StatusBar.currentHeight : 0,
  },
  loaderContainer: { flex: 1, justifyContent: "center", alignItems: "center" },
  timeSmall: {
    fontSize: 10,
    color: "#999",
    marginTop: 2,
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
  feedContentContainer: { paddingBottom: 24 },
  post: {
    backgroundColor: "#fff",
    marginBottom: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  postAvatar: { width: 32, height: 32, borderRadius: 16 },
  postUser: { flex: 1, fontWeight: "700", fontSize: 14, color: "#111" },
  postImage: { width: "100%", aspectRatio: 1 },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  iconBtn: { padding: 6 },
  likes: { fontWeight: "700", marginHorizontal: 12, marginTop: 2 },
  caption: { marginHorizontal: 12, marginTop: 4, color: "#222" },
  captionUser: { fontWeight: "700" },
  commentCountText: {
    marginHorizontal: 12,
    marginTop: 6,
    color: "#777",
    fontSize: 14,
  },
  time: {
    marginHorizontal: 12,
    marginVertical: 8,
    fontSize: 12,
    color: "#777",
    textTransform: "uppercase",
  },
  loadingMoreIndicator: { marginVertical: 16 },
  composer: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    padding: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: "#eee",
    marginBottom: 8,
  },
  composerAvatar: { width: 36, height: 36, borderRadius: 18 },
  input: {
    backgroundColor: "#f2f2f2",
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    minHeight: 40,
  },
  preview: { marginTop: 8, width: "100%", height: 180, borderRadius: 12 },
  composerActions: { flexDirection: "row", alignItems: "center", marginTop: 8 },
  composerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#f7e8ff",
  },
  composerBtnText: { color: "#9C6ADE", fontWeight: "700" },
  publishBtn: {
    backgroundColor: "#9C6ADE",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 999,
  },
  publishText: { color: "#fff", fontWeight: "700" },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#dbdbdb",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold" },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
    paddingHorizontal: 16,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1 },
  commentUser: { fontWeight: "bold", marginBottom: 2 },
  commentText: { fontSize: 14, color: "#333" },
  emptyCommentsText: { textAlign: "center", marginTop: 40, color: "#999" },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#dbdbdb",
    backgroundColor: "#fff",
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginLeft: 8,
    maxHeight: 100,
  },
  sendButton: { marginLeft: 8, padding: 4 },
  menuOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  menuOptionText: {
    marginLeft: 12,
    fontSize: 16,
    color: "#333",
  },
});
