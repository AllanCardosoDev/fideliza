import { useState, useEffect, useCallback } from "react";

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const GOOGLE_DRIVE_FOLDER_ID = import.meta.env.VITE_GOOGLE_DRIVE_FOLDER_ID;
const SCOPES = "https://www.googleapis.com/auth/drive.file";

// Função auxiliar para esperar o carregamento da API do Google
const waitForGapiLoad = () => {
  return new Promise((resolve) => {
    if (window.gapi) {
      resolve(window.gapi);
    } else {
      const checkInterval = setInterval(() => {
        if (window.gapi) {
          clearInterval(checkInterval);
          resolve(window.gapi);
        }
      }, 100);

      // Timeout de 10 segundos
      setTimeout(() => {
        clearInterval(checkInterval);
        resolve(null);
      }, 10000);
    }
  });
};

export function useGoogleDriveOAuth() {
  const [user, setUser] = useState(null);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Inicializar Google API
  useEffect(() => {
    const initGoogleAPI = async () => {
      try {
        // Esperar o gapi estar disponível
        const gapi = await waitForGapiLoad();

        if (!gapi) {
          setError("Falha ao carregar Google API. Verifique sua conexão.");
          setIsLoading(false);
          return;
        }

        if (!GOOGLE_CLIENT_ID) {
          setError(
            "Google Client ID não configurado. Verifique seu .env.local",
          );
          setIsLoading(false);
          return;
        }

        gapi.load("client:auth2", async () => {
          try {
            await gapi.client.init({
              clientId: GOOGLE_CLIENT_ID,
              scope: SCOPES,
            });

            const auth2 = gapi.auth2.getAuthInstance();

            // Verificar se já está logado
            if (auth2.isSignedIn.get()) {
              const googleUser = auth2.currentUser.get();
              setUser(googleUser);
              setIsSignedIn(true);
              saveTokenToLocalStorage(googleUser);
            } else {
              // Tentar restaurar token do localStorage
              const savedToken = localStorage.getItem("google_oauth_token");
              if (savedToken) {
                try {
                  // Tentar autorizar com token salvo
                  await auth2.signIn();
                  const googleUser = auth2.currentUser.get();
                  setUser(googleUser);
                  setIsSignedIn(true);
                } catch (err) {
                  console.log("Token expirado ou inválido");
                  localStorage.removeItem("google_oauth_token");
                }
              }
            }

            // Listener para mudanças de autenticação
            auth2.isSignedIn.listen(handleSignInStatusChange);

            setIsLoading(false);
          } catch (err) {
            setError("Erro ao inicializar Google API: " + err.message);
            console.error("Google API init error:", err);
            setIsLoading(false);
          }
        });
      } catch (err) {
        setError("Erro ao carregar Google API: " + err.message);
        console.error("Google API load error:", err);
        setIsLoading(false);
      }
    };

    initGoogleAPI();
  }, []);

  const handleSignInStatusChange = useCallback((isSignedInStatus) => {
    if (!window.gapi) return;

    if (isSignedInStatus) {
      const auth2 = window.gapi.auth2.getAuthInstance();
      const googleUser = auth2.currentUser.get();
      setUser(googleUser);
      setIsSignedIn(true);
      saveTokenToLocalStorage(googleUser);
    } else {
      setUser(null);
      setIsSignedIn(false);
      localStorage.removeItem("google_oauth_token");
    }
  }, []);

  const saveTokenToLocalStorage = (googleUser) => {
    const authResponse = googleUser.getAuthResponse();
    if (authResponse) {
      localStorage.setItem("google_oauth_token", authResponse.id_token);
      localStorage.setItem("google_oauth_expires_in", authResponse.expires_in);
      localStorage.setItem(
        "google_oauth_timestamp",
        new Date().getTime().toString(),
      );
    }
  };

  const signIn = useCallback(async () => {
    try {
      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }
      setError(null);
      const auth2 = window.gapi.auth2.getAuthInstance();
      const googleUser = await auth2.signIn();
      setUser(googleUser);
      setIsSignedIn(true);
      saveTokenToLocalStorage(googleUser);
      return googleUser;
    } catch (err) {
      const errorMsg = `Erro ao fazer login: ${err.message}`;
      setError(errorMsg);
      throw err;
    }
  }, []);

  const signOut = useCallback(async () => {
    try {
      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }
      setError(null);
      const auth2 = window.gapi.auth2.getAuthInstance();
      await auth2.signOut();
      setUser(null);
      setIsSignedIn(false);
      localStorage.removeItem("google_oauth_token");
    } catch (err) {
      const errorMsg = `Erro ao fazer logout: ${err.message}`;
      setError(errorMsg);
      throw err;
    }
  }, []);

  const uploadFile = useCallback(
    async (file, clientName, documentType) => {
      if (!isSignedIn) {
        throw new Error("Você não está logado no Google. Faça login primeiro.");
      }

      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }

      try {
        setError(null);

        // Criar pasta do cliente se não existir
        const clientFolder = await getOrCreateClientFolder(clientName);

        // Upload do arquivo
        const fileMetadata = {
          name: `${documentType}_${file.name}`,
          parents: [clientFolder.id],
        };

        const media = {
          mimeType: file.type,
          body: file,
        };

        const response = await window.gapi.client.drive.files.create({
          resource: fileMetadata,
          media: media,
          fields: "id, name, mimeType, createdTime, size, webViewLink",
        });

        if (response.result) {
          return {
            success: true,
            fileId: response.result.id,
            fileName: response.result.name,
            fileUrl: response.result.webViewLink,
            fileSize: response.result.size,
            uploadedAt: response.result.createdTime,
          };
        } else {
          throw new Error("Erro ao fazer upload do arquivo");
        }
      } catch (err) {
        const errorMsg = `Erro ao fazer upload: ${err.message}`;
        setError(errorMsg);
        throw err;
      }
    },
    [isSignedIn, getOrCreateClientFolder],
  );

  const getOrCreateClientFolder = useCallback(async (clientName) => {
    try {
      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }

      // Procurar pasta do cliente na pasta raiz (GOOGLE_DRIVE_FOLDER_ID)
      const query = `'${GOOGLE_DRIVE_FOLDER_ID}' in parents and name='${clientName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

      const response = await window.gapi.client.drive.files.list({
        q: query,
        spaces: "drive",
        fields: "files(id, name)",
        pageSize: 1,
      });

      if (response.result.files.length > 0) {
        return response.result.files[0];
      }

      // Se não existir, criar pasta
      const folderMetadata = {
        name: clientName,
        mimeType: "application/vnd.google-apps.folder",
        parents: [GOOGLE_DRIVE_FOLDER_ID],
      };

      const createResponse = await window.gapi.client.drive.files.create({
        resource: folderMetadata,
        fields: "id, name",
      });

      return createResponse.result;
    } catch (err) {
      console.error("Erro ao criar/encontrar pasta do cliente:", err);
      throw err;
    }
  }, []);

  const listClientDocuments = useCallback(
    async (clientName) => {
      if (!isSignedIn) {
        throw new Error("Você não está logado no Google.");
      }

      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }

      try {
        const clientFolder = await getOrCreateClientFolder(clientName);
        const query = `'${clientFolder.id}' in parents and trashed=false`;

        const response = await window.gapi.client.drive.files.list({
          q: query,
          spaces: "drive",
          fields: "files(id, name, mimeType, createdTime, size, webViewLink)",
          pageSize: 100,
        });

        return response.result.files || [];
      } catch (err) {
        console.error("Erro ao listar documentos:", err);
        throw err;
      }
    },
    [isSignedIn, getOrCreateClientFolder],
  );

  const deleteFile = useCallback(
    async (fileId) => {
      if (!isSignedIn) {
        throw new Error("Você não está logado no Google.");
      }

      if (!window.gapi) {
        throw new Error("Google API não está carregada");
      }

      try {
        await window.gapi.client.drive.files.delete({
          fileId: fileId,
        });
        return { success: true };
      } catch (err) {
        const errorMsg = `Erro ao deletar arquivo: ${err.message}`;
        setError(errorMsg);
        throw err;
      }
    },
    [isSignedIn],
  );

  return {
    user,
    isSignedIn,
    isLoading,
    error,
    signIn,
    signOut,
    uploadFile,
    listClientDocuments,
    deleteFile,
  };
}
