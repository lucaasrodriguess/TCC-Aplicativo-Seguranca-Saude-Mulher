import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";

import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref, uploadBytes } from "firebase/storage";
import React, { createContext, ReactNode, useEffect, useState } from "react";
import { auth, db, storage } from "../services/firebaseConfig";

WebBrowser.maybeCompleteAuthSession();

export type AppUser = {
  uid: string;
  name: string;
  email: string;
  phone: string;
  avatar: string;
};

export type UserContextType = {
  user: AppUser | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
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

const DEFAULT_AVATAR_URL =
  "https://firebasestorage.googleapis.com/v0/b/tcc-safeher.firebasestorage.app/o/perfil%2Fperfil.jpg?alt=media&token=e93dc4cd-c894-415e-aa61-8448901b1593";

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AppUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    androidClientId:
      "[804183132983-ccigi07v47laa8tap010qqibol7c76m7.apps.googleusercontent.com](http://804183132983-ccigi07v47laa8tap010qqibol7c76m7.apps.googleusercontent.com/)",
    webClientId:
      "[804183132983-q5rd81hpt7nfmc2rt2uk3ubnf3p6tdnm.apps.googleusercontent.com](http://804183132983-q5rd81hpt7nfmc2rt2uk3ubnf3p6tdnm.apps.googleusercontent.com/)",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const userDocRef = doc(db, "users", firebaseUser.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            setUser({ uid: firebaseUser.uid, ...userDoc.data() } as AppUser);
          } else {
            const newUserProfile = {
              name: firebaseUser.displayName || "Usuário",
              email: firebaseUser.email || "",
              phone: firebaseUser.phoneNumber || "",
              avatar: firebaseUser.photoURL || DEFAULT_AVATAR_URL,
            };
            await setDoc(userDocRef, newUserProfile);
            setUser({ uid: firebaseUser.uid, ...newUserProfile });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Erro no listener de autenticação:", error);
      } finally {
        setIsLoading(false);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const signInWithGoogle = async () => {
    await promptAsync();
  };
  const logout = async () => {
    await signOut(auth);
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    imageUri: string | null
  ) => {
    // 1. Cria o utilizador na autenticação do Firebase
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    const firebaseUser = userCredential.user;
    let finalAvatarUrl = DEFAULT_AVATAR_URL;

    // 2. Se uma imagem foi selecionada, faz o upload
    if (imageUri) {
      try {
        const response = await fetch(imageUri);
        const blob = await response.blob();
        // Caminho no Storage: profile_pictures/UID_DO_UTILIZADOR
        const storageRef = ref(storage, `profile_pictures/${firebaseUser.uid}`);
        await uploadBytes(storageRef, blob);
        finalAvatarUrl = await getDownloadURL(storageRef);
      } catch (uploadError: any) {
        // "any" para podermos ver o objeto todo
        console.error(
          "Erro detalhado ao fazer upload da imagem no registo:",
          JSON.stringify(uploadError, null, 2) // <-- A MUDANÇA É AQUI
        );
        // Se o upload falhar, continua a usar a foto padrão, não impede o registo.
      }
    }

    // 3. Atualiza o perfil na autenticação do Firebase (nome e foto)
    await updateProfile(firebaseUser, {
      displayName: name,
      photoURL: finalAvatarUrl,
    });

    // 4. Cria o documento do utilizador no Firestore com todos os dados
    const userProfileData = { name, email, phone: "", avatar: finalAvatarUrl };
    await setDoc(doc(db, "users", firebaseUser.uid), userProfileData);

    // 5. Atualiza o estado local do aplicativo
    setUser({ uid: firebaseUser.uid, ...userProfileData });
  };

  const updateUser = async (newUserData: Partial<AppUser>) => {
    if (!user || !auth.currentUser)
      throw new Error("Utilizador não autenticado.");

    try {
      const dataToUpdate = { ...newUserData };
      let finalAvatarUrl = user.avatar; // Começa com a foto atual

      // Se uma nova foto foi selecionada, faz o upload dela
      if (dataToUpdate.avatar && dataToUpdate.avatar.startsWith("file://")) {
        try {
          const response = await fetch(dataToUpdate.avatar);
          const blob = await response.blob();
          const storageRef = ref(storage, `profile_pictures/${user.uid}`);
          await uploadBytes(storageRef, blob);
          finalAvatarUrl = await getDownloadURL(storageRef);
          dataToUpdate.avatar = finalAvatarUrl; // Atualiza para a nova URL
        } catch (uploadError) {
          console.error(
            "Erro ao fazer upload da nova imagem de perfil:",
            uploadError
          );
          // Se o upload falhar, reverte para a imagem antiga para não quebrar o perfil
          dataToUpdate.avatar = user.avatar;
        }
      }

      // Atualiza o perfil na autenticação do Firebase
      await updateProfile(auth.currentUser, {
        displayName: dataToUpdate.name,
        photoURL: finalAvatarUrl,
      });

      // Atualiza o documento no Firestore
      await updateDoc(doc(db, "users", user.uid), dataToUpdate);

      // Atualiza o estado local no aplicativo para refletir as mudanças imediatamente
      setUser((current) =>
        current ? ({ ...current, ...dataToUpdate } as AppUser) : null
      );
    } catch (error) {
      console.error("Erro detalhado ao atualizar perfil:", error);
      throw error;
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
