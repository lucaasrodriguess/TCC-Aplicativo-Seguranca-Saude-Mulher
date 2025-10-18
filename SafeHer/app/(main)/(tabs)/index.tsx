import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "expo-router";
import React, { useCallback, useContext, useEffect, useState } from "react";
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
import { UserContext, UserContextType } from "../../../contexts/UserContext";

// --- IMPORTS DO FIREBASE ---
import { DrawerActions } from "@react-navigation/native";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  increment,
  limit,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import { db } from "../../../services/firebaseConfig";

// --- TIPOS E DADOS ---
export type Comment = {
  id: string;
  userId: string;
  user: { name: string; avatar: string };
  text: string;
  createdAt: string;
};
export type Post = {
  id: string;
  userId: string;
  user: { name: string; avatar: string };
  imageURL: string;
  caption: string;
  likes: number;
  liked: boolean;
  createdAt: string;
  commentsCount: number;
};

// --- FUNÇÃO AUXILIAR ---
function timeSince(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return `${Math.floor(interval)}a`;
  interval = seconds / 2592000;
  if (interval > 1) return `${Math.floor(interval)}m`;
  interval = seconds / 86400;
  if (interval > 1) return `${Math.floor(interval)}d`;
  interval = seconds / 3600;
  if (interval > 1) return `${Math.floor(interval)}h`;
  interval = seconds / 60;
  if (interval > 1) return `${Math.floor(interval)} min`;
  return "agora";
}

// --- COMPONENTES VISUAIS ---

const Header = () => {
  const navigation = useNavigation();
  const context = useContext(UserContext) as UserContextType;
  const user = context?.user;
  const userName = user?.name ? user.name.split(" ")[0] : "Usuária";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.headerContainer}>
        <Pressable
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
          style={styles.menuBtn}
        >
          <Ionicons name="menu" size={28} color="#fff" />
        </Pressable>
        <Text numberOfLines={1} style={styles.title}>
          Bem-vinda, {userName}!
        </Text>
        <Pressable
          style={styles.avatarBtn}
          onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
        >
          {user?.avatar ? (
            <Image source={{ uri: user.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatar, { backgroundColor: "#fff" }]} />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
};

const PostCard = ({
  post,
  currentUser,
  onToggleLike,
  onCommentPress,
  onDeletePost,
}: {
  post: Post;
  currentUser: UserContextType["user"];
  onToggleLike: (id: string) => void;
  onCommentPress: (postId: string) => void;
  onDeletePost: (postId: string) => void;
}) => {
  const timeAgo = timeSince(new Date(post.createdAt));
  const isMyPost = currentUser?.uid === post.userId;

  // CORREÇÃO DE SEGURANÇA: Evita o crash se 'post.user' não existir
  const userAvatar = post.user?.avatar;
  const userName = post.user?.name || "Usuário";

  return (
    <View style={styles.post}>
      <View style={styles.postHeader}>
        {userAvatar ? (
          <Image source={{ uri: userAvatar }} style={styles.postAvatar} />
        ) : (
          <View style={[styles.postAvatar, { backgroundColor: "#ccc" }]} /> // Placeholder
        )}
        <Text style={styles.postUser} numberOfLines={1}>
          {userName}
        </Text>
        {isMyPost && (
          <Pressable
            onPress={() => onDeletePost(post.id)}
            style={styles.iconBtn}
          >
            <Ionicons name="trash-outline" size={22} color="#FF6B6B" />
          </Pressable>
        )}
      </View>
      {post.imageURL ? (
        <Image source={{ uri: post.imageURL }} style={styles.postImage} />
      ) : null}
      <View style={styles.actionsRow}>
        <Pressable onPress={() => onToggleLike(post.id)} style={styles.iconBtn}>
          <Ionicons
            name={post.liked ? "heart" : "heart-outline"}
            size={28}
            color={post.liked ? "#FF6B6B" : "#333"}
          />
        </Pressable>
        <Pressable
          onPress={() => onCommentPress(post.id)}
          style={styles.iconBtn}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={28} color="#333" />
        </Pressable>
      </View>
      <Text style={styles.likes}>{post.likes} curtidas</Text>
      {post.caption ? (
        <Text style={styles.caption}>
          <Text style={styles.captionUser}>{userName} </Text>
          {post.caption}
        </Text>
      ) : null}
      {post.commentsCount > 0 && (
        <Pressable onPress={() => onCommentPress(post.id)}>
          <Text
            style={styles.commentCountText}
          >{`Ver todos os ${post.commentsCount} comentários`}</Text>
        </Pressable>
      )}
      <Text style={styles.time}>{timeAgo}</Text>
    </View>
  );
};

const CommentsModal = ({
  post,
  currentUser,
  isVisible,
  onClose,
  onAddComment,
  onDeleteComment,
  isLoadingComments,
}: {
  post: (Post & { comments: Comment[] }) | null;
  currentUser: UserContextType["user"];
  isVisible: boolean;
  onClose: () => void;
  onAddComment: (postId: string, commentText: string) => Promise<void>;
  onDeleteComment: (postId: string, commentId: string) => void;
  isLoadingComments: boolean;
}) => {
  const [commentText, setCommentText] = useState("");
  const [isSending, setIsSending] = useState(false);
  const isMyPost = currentUser?.uid === post?.userId;

  const handleSendComment = async () => {
    if (post && commentText.trim().length > 0) {
      setIsSending(true);
      try {
        await onAddComment(post.id, commentText.trim());
        setCommentText("");
      } finally {
        setIsSending(false);
      }
    }
  };

  const confirmDelete = (postId: string, commentId: string) => {
    Alert.alert("Excluir Comentário", "Tem certeza?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: () => onDeleteComment(postId, commentId),
      },
    ]);
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
            color="#003249"
            style={{ marginTop: 20 }}
          />
        ) : (
          <FlatList
            data={post?.comments || []}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                onLongPress={() => isMyPost && confirmDelete(post!.id, item.id)}
              >
                <View style={styles.commentItem}>
                  <Image
                    source={{ uri: item.user.avatar }}
                    style={styles.commentAvatar}
                  />
                  <View style={styles.commentContent}>
                    <Text>
                      <Text style={styles.commentUser}>{item.user.name} </Text>
                      <Text style={styles.commentText}>{item.text}</Text>
                    </Text>
                    <Text style={styles.timeSmall}>
                      {timeSince(new Date(item.createdAt))}
                    </Text>
                  </View>
                </View>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.emptyCommentsText}>
                Seja a primeira a comentar!
              </Text>
            }
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 80 }}
          />
        )}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={0}
        >
          <View style={styles.commentInputContainer}>
            {currentUser?.avatar && (
              <Image
                source={{ uri: currentUser.avatar }}
                style={styles.commentAvatar}
              />
            )}
            <TextInput
              placeholder="Adicione um comentário..."
              value={commentText}
              onChangeText={setCommentText}
              style={styles.commentInput}
              editable={!isSending}
              multiline
            />
            <Pressable
              onPress={handleSendComment}
              style={styles.sendButton}
              disabled={isSending || !commentText.trim()}
            >
              {isSending ? (
                <ActivityIndicator color="#003249" size="small" />
              ) : (
                <Ionicons
                  name="arrow-up-circle"
                  size={32}
                  color={commentText.trim() ? "#003249" : "#ccc"}
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
  const [refreshing, setRefreshing] = useState(true);
  const [isCommentsVisible, setIsCommentsVisible] = useState(false);
  const [selectedPost, setSelectedPost] = useState<
    (Post & { comments: Comment[] }) | null
  >(null);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const userLikesRef = React.useRef(new Set<string>());

  const fetchUserLikes = useCallback(async () => {
    if (!user?.uid) return;
    try {
      const q = query(collection(db, "likes"), where("userId", "==", user.uid));
      const snapshot = await getDocs(q);
      const likedPostIds = new Set<string>();
      snapshot.forEach((doc) => likedPostIds.add(doc.data().postId));
      userLikesRef.current = likedPostIds;
    } catch (e) {
      console.error("Erro ao buscar likes:", e);
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setRefreshing(true);
      await fetchUserLikes();
      const q = query(
        collection(db, "posts"),
        orderBy("createdAt", "desc"),
        limit(50)
      );
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          // CORREÇÃO DEFINITIVA: Mapeia os dados do Firebase para o objeto Post corretamente
          const newPosts = snapshot.docs.map((doc) => {
            const data = doc.data();
            return {
              id: doc.id,
              userId: data.userId,
              user: { name: data.userName, avatar: data.userAvatar },
              imageURL: data.imageURL,
              caption: data.caption,
              likes: data.likes || 0,
              liked: userLikesRef.current.has(doc.id),
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
        }
      );
      return () => unsubscribe();
    };
    fetchData();
  }, [user, fetchUserLikes]);

  const toggleLike = useCallback(
    async (postId: string) => {
      if (!user) return;
      const isLiked = userLikesRef.current.has(postId);
      const postRef = doc(db, "posts", postId);
      const likeRef = doc(db, "likes", `${postId}_${user.uid}`);
      const change = isLiked ? -1 : 1;
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, liked: !isLiked, likes: p.likes + change }
            : p
        )
      );
      if (isLiked) userLikesRef.current.delete(postId);
      else userLikesRef.current.add(postId);
      try {
        await updateDoc(postRef, { likes: increment(change) });
        if (isLiked) await deleteDoc(likeRef);
        else await setDoc(likeRef, { userId: user.uid, postId });
      } catch (error) {
        console.error("Erro ao curtir:", error);
        setPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, liked: isLiked, likes: p.likes - change }
              : p
          )
        );
        if (isLiked) userLikesRef.current.add(postId);
        else userLikesRef.current.delete(postId);
      }
    },
    [user]
  );

  const handleLoadComments = useCallback(
    async (postId: string) => {
      setIsLoadingComments(true);
      try {
        const q = query(
          collection(db, "comments"),
          where("postId", "==", postId),
          orderBy("createdAt", "asc")
        );
        const snapshot = await getDocs(q);
        const comments = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            userId: data.userId,
            user: { name: data.userName, avatar: data.userAvatar },
            text: data.text,
            createdAt:
              data.createdAt?.toDate().toISOString() ||
              new Date().toISOString(),
          } as Comment;
        });
        const post = posts.find((p) => p.id === postId);
        if (post) setSelectedPost({ ...post, comments });
      } catch (error) {
        console.error("Erro ao carregar comentários:", error);
      } finally {
        setIsLoadingComments(false);
      }
    },
    [posts]
  );

  const handleCommentPress = useCallback(
    (postId: string) => {
      const post = posts.find((p) => p.id === postId);
      if (post) {
        setSelectedPost({ ...post, comments: [] });
        setIsCommentsVisible(true);
        handleLoadComments(postId);
      }
    },
    [posts, handleLoadComments]
  );

  const handleAddComment = useCallback(
    async (postId: string, commentText: string) => {
      if (!user) return;
      try {
        await addDoc(collection(db, "comments"), {
          postId,
          userId: user.uid,
          userName: user.name,
          userAvatar: user.avatar,
          text: commentText,
          createdAt: serverTimestamp(),
        });
        await updateDoc(doc(db, "posts", postId), {
          commentsCount: increment(1),
        });
        handleLoadComments(postId);
      } catch (error) {
        console.error("Erro ao adicionar comentário:", error);
      }
    },
    [user, handleLoadComments]
  );

  const handleDeleteComment = useCallback(
    async (postId: string, commentId: string) => {
      try {
        await deleteDoc(doc(db, "comments", commentId));
        await updateDoc(doc(db, "posts", postId), {
          commentsCount: increment(-1),
        });
        handleLoadComments(postId);
      } catch (error) {
        console.error("Erro ao deletar comentário:", error);
        Alert.alert("Erro", "Não foi possível deletar o comentário.");
      }
    },
    [handleLoadComments]
  );

  const handleDeletePost = (postId: string) => {
    Alert.alert("Excluir Publicação", "Tem certeza?", [
      { text: "Cancelar" },
      {
        text: "Excluir",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteDoc(doc(db, "posts", postId));
          } catch (error) {
            console.error("Erro ao deletar post:", error);
            Alert.alert("Erro", "Não foi possível excluir.");
          }
        },
      },
    ]);
  };

  const onRefresh = useCallback(() => {
    if (user) fetchUserLikes();
  }, [user, fetchUserLikes]);

  if (refreshing && !posts.length) {
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="large" color="#003249" />
      </View>
    );
  }

  return (
    <View style={styles.appContainer}>
      <StatusBar barStyle="light-content" backgroundColor="#003249" />
      <Header />
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PostCard
            post={item}
            currentUser={user}
            onToggleLike={toggleLike}
            onCommentPress={handleCommentPress}
            onDeletePost={handleDeletePost}
          />
        )}
        contentContainerStyle={styles.feedContentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#003249"
          />
        }
      />
      <CommentsModal
        post={selectedPost}
        currentUser={user}
        isVisible={isCommentsVisible}
        onClose={() => setIsCommentsVisible(false)}
        onAddComment={handleAddComment}
        onDeleteComment={handleDeleteComment}
        isLoadingComments={isLoadingComments}
      />
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: "#FAF9F6" },
  safe: { backgroundColor: "#003249" },
  headerContainer: {
    height: 60,
    backgroundColor: "#003249",
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  loaderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FAF9F6",
  },
  menuBtn: { padding: 8 },
  title: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginHorizontal: 10,
  },
  avatarBtn: { padding: 2 },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: "#fff",
  },
  feedContentContainer: { paddingBottom: 100 },
  post: {
    backgroundColor: "#fff",
    marginVertical: 6,
    marginHorizontal: 10,
    borderRadius: 16,
    shadowColor: "#9E9E9E",
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    overflow: "hidden",
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  postAvatar: { width: 36, height: 36, borderRadius: 18 },
  postUser: { flex: 1, fontWeight: "bold", fontSize: 15, color: "#111" },
  postImage: { width: "100%", aspectRatio: 4 / 3, backgroundColor: "#eee" },
  actionsRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingTop: 8,
  },
  iconBtn: { padding: 8 },
  likes: {
    fontWeight: "bold",
    marginHorizontal: 16,
    marginTop: 4,
    fontSize: 13,
    color: "#333",
  },
  caption: {
    marginHorizontal: 16,
    marginTop: 4,
    color: "#333",
    fontSize: 14,
    lineHeight: 20,
  },
  captionUser: { fontWeight: "bold" },
  commentCountText: {
    marginHorizontal: 16,
    marginTop: 8,
    color: "#888",
    fontSize: 13,
    fontWeight: "500",
  },
  time: {
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 12,
    fontSize: 11,
    color: "#aaa",
  },
  modalContainer: { flex: 1, backgroundColor: "#fff" },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: "#003249" },
  commentItem: {
    flexDirection: "row",
    paddingVertical: 12,
    gap: 12,
    paddingHorizontal: 16,
  },
  commentAvatar: { width: 32, height: 32, borderRadius: 16 },
  commentContent: { flex: 1, gap: 4 },
  commentUser: { fontWeight: "bold" },
  commentText: { fontSize: 14, color: "#333", lineHeight: 20 },
  timeSmall: { fontSize: 11, color: "#999" },
  emptyCommentsText: {
    textAlign: "center",
    marginTop: 40,
    color: "#999",
    fontSize: 16,
  },
  commentInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderTopWidth: 1,
    borderTopColor: "#dbdbdb",
    backgroundColor: "#fff",
    paddingBottom: Platform.OS === "ios" ? 24 : 8,
  },
  commentInput: {
    flex: 1,
    backgroundColor: "#f2f2f2",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    marginLeft: 8,
    maxHeight: 100,
    fontSize: 15,
  },
  sendButton: { marginLeft: 8, padding: 4 },
});
