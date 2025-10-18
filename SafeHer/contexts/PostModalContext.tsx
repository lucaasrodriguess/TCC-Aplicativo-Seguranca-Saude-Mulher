import React, { createContext, ReactNode, useState } from "react";

// Define o que o contexto vai fornecer
type PostModalContextType = {
  isPostModalVisible: boolean;
  setPostModalVisible: (isVisible: boolean) => void;
};

// Cria o contexto com um valor padrão
export const PostModalContext = createContext<PostModalContextType>({
  isPostModalVisible: false,
  setPostModalVisible: () => {},
});

// Cria o "Provedor" que vai envolver nosso app
export const PostModalProvider = ({ children }: { children: ReactNode }) => {
  const [isPostModalVisible, setPostModalVisible] = useState(false);

  return (
    <PostModalContext.Provider
      value={{ isPostModalVisible, setPostModalVisible }}
    >
      {children}
    </PostModalContext.Provider>
  );
};
