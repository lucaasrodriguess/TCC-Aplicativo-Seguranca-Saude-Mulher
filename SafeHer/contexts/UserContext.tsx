import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import {
  createUserWithEmailAndPassword,
  User as FirebaseUser,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { auth, db, storage } from "../services/firebaseConfig"; // Verifique se o caminho está correto

// Fecha a janela do navegador do Google automaticamente após o login
WebBrowser.maybeCompleteAuthSession();

// O tipo de usuário que usamos dentro do nosso app
export type AppUser = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

// O que o nosso Context vai fornecer para o resto do app
export type UserContextType = {
  user: AppUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  // O tipo de retorno foi simplificado para refletir que o erro será JOGADO, não retornado
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (
    name: string,
    email: string,
    password: string,
    imageUri: string | null
  ) => Promise<void>;
  updateUser: (newUserData: Partial<AppUser>) => Promise<void>;
};

export const UserContext = createContext<UserContextType | undefined>(
  undefined
);

// CORREÇÃO 1: Corrigindo o erro de tipagem de props no UserProvider
export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId:
      "804183132983-ccigi07v47laa8tap010qqibol7c76m7.apps.googleusercontent.com",
    webClientId:
      "804183132983-q5rd81hpt7nfmc2rt2uk3ubnf3p6tdnm.apps.googleusercontent.com",
  });

  // Listener principal do Firebase para manter o estado do usuário sincronizado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser: FirebaseUser | null) => {
        try {
          if (firebaseUser) {
            const userDocRef = doc(db, "users", firebaseUser.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
              setUser({ uid: firebaseUser.uid, ...userDoc.data() } as AppUser);
            } else {
              // Se é o primeiro login (ex: com Google), cria um perfil básico no Firestore
              const newUserProfile: Omit<AppUser, "uid"> = {
                name: firebaseUser.displayName || "Usuário",
                email: firebaseUser.email || "",
                phone: firebaseUser.phoneNumber || "",
                avatar:
                  firebaseUser.photoURL ||
                  `https://i.pravatar.cc/150?u=${firebaseUser.uid}`,
              };
              await setDoc(userDocRef, newUserProfile);
              setUser({ uid: firebaseUser.uid, ...newUserProfile });
            }
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error(
            "Erro ao verificar estado de autenticação ou buscar dados:",
            error
          );
          setUser(null);
        } finally {
          setIsLoading(false);
        }
      }
    );

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    setIsLoading(true);
    await promptAsync();
  };

 
  const login = async (email: string, password: string): Promise<void> => {
    try {
      // O Login bem-sucedido aciona o useEffect do onAuthStateChanged
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      throw error;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    imageUri: string | null
  ) => {
    setIsLoading(true);
    try {
      // 1. Cria o usuário no serviço de Autenticação
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      const defaultAvatar = `https://i.pravatar.cc/150?u=${firebaseUser.uid}`;
      let finalAvatarUrl = defaultAvatar;

      // 2. Se o usuário escolheu uma imagem, faz o upload
      if (imageUri) {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        const storageRef = ref(storage, `profile_pictures/${firebaseUser.uid}`);
        await uploadBytes(storageRef, blob);
        finalAvatarUrl = await getDownloadURL(storageRef);
      }

      // 3. Prepara o objeto do perfil que será salvo no Firestore
      const userProfileData = {
        name,
        email,
        phone: "", // Telefone pode ser adicionado depois no perfil
        avatar: finalAvatarUrl,
      };

      // 4. Salva os dados completos no Firestore
      const userDocRef = doc(db, "users", firebaseUser.uid);
      await setDoc(userDocRef, userProfileData);

      // 5. Atualiza o perfil no serviço de Autenticação (nome e foto)
      await updateProfile(firebaseUser, {
        displayName: name,
        photoURL: finalAvatarUrl,
      });

      // 6. ATUALIZA O ESTADO LOCAL para refletir a mudança imediatamente no app
      setUser({
        uid: firebaseUser.uid,
        ...userProfileData,
      });
    } catch (error) {
      throw error; // Joga o erro para a tela de UI
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await signOut(auth);
    } finally {
      setIsLoading(false);
    }
  };

  const updateUser = async (newUserData: Partial<AppUser>) => {
    if (!user) return;
    setIsLoading(true);
    try {
      const userDocRef = doc(db, "users", user.uid);
      await updateDoc(userDocRef, newUserData);
      setUser((currentUser) =>
        currentUser ? ({ ...currentUser, ...newUserData } as AppUser) : null
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <UserContext.Provider
      value={{
        user,
        isLoading,
        signInWithGoogle,
        login,
        logout,
        register,
        updateUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
