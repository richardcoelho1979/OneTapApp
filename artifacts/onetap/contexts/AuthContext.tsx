import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as SecureStore from 'expo-secure-store';
import { 
  UserProfile, 
  useGetMe, 
  getGetMeQueryKey,
  useLogin, 
  useRegister, 
  useLoginWithGoogle, 
  useLoginWithApple,
  useLogout 
} from '@workspace/api-client-react';
import { setAuthTokenGetter, setBaseUrl } from '@workspace/api-client-react';

interface AuthContextValue {
  user: UserProfile | null;
  accessToken: string | null;
  isLoading: boolean;
  login: ReturnType<typeof useLogin>['mutateAsync'];
  register: ReturnType<typeof useRegister>['mutateAsync'];
  loginWithGoogle: ReturnType<typeof useLoginWithGoogle>['mutateAsync'];
  loginWithApple: ReturnType<typeof useLoginWithApple>['mutateAsync'];
  logout: () => Promise<void>;
  setUser: (user: UserProfile | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: meData, isError, refetch } = useGetMe({ 
    query: { 
      enabled: !!accessToken,
      retry: false,
      queryKey: getGetMeQueryKey()
    } 
  });

  const loginMutation = useLogin();
  const registerMutation = useRegister();
  const googleMutation = useLoginWithGoogle();
  const appleMutation = useLoginWithApple();
  const logoutMutation = useLogout();

  useEffect(() => {
    // Setup the getter for api-client
    setAuthTokenGetter(() => {
      return SecureStore.getItemAsync('onetap_access_token');
    });

    const initAuth = async () => {
      try {
        const storedToken = await SecureStore.getItemAsync('onetap_access_token');
        if (storedToken) {
          setAccessToken(storedToken);
        }
      } catch (e) {
        console.error('Failed to restore auth token', e);
      } finally {
        setIsLoading(false);
      }
    };
    initAuth();
  }, []);

  useEffect(() => {
    if (meData) {
      setUser(meData);
    }
  }, [meData]);

  useEffect(() => {
    if (isError) {
      // Token might be invalid
      handleLogout();
    }
  }, [isError]);

  const handleSetTokens = async (access: string, refresh: string) => {
    await SecureStore.setItemAsync('onetap_access_token', access);
    await SecureStore.setItemAsync('onetap_refresh_token', refresh);
    setAccessToken(access);
    refetch();
  };

  const handleLogout = async () => {
    try {
      await logoutMutation.mutateAsync();
    } catch (e) {
      // Ignore errors on logout
    }
    await SecureStore.deleteItemAsync('onetap_access_token');
    await SecureStore.deleteItemAsync('onetap_refresh_token');
    setAccessToken(null);
    setUser(null);
  };

  const login = useCallback(async (params: Parameters<typeof loginMutation.mutateAsync>[0]) => {
    const res = await loginMutation.mutateAsync(params);
    await handleSetTokens(res.accessToken, res.refreshToken);
    return res;
  }, [loginMutation]);

  const register = useCallback(async (params: Parameters<typeof registerMutation.mutateAsync>[0]) => {
    const res = await registerMutation.mutateAsync(params);
    await handleSetTokens(res.accessToken, res.refreshToken);
    return res;
  }, [registerMutation]);

  const loginWithGoogle = useCallback(async (params: Parameters<typeof googleMutation.mutateAsync>[0]) => {
    const res = await googleMutation.mutateAsync(params);
    await handleSetTokens(res.accessToken, res.refreshToken);
    return res;
  }, [googleMutation]);

  const loginWithApple = useCallback(async (params: Parameters<typeof appleMutation.mutateAsync>[0]) => {
    const res = await appleMutation.mutateAsync(params);
    await handleSetTokens(res.accessToken, res.refreshToken);
    return res;
  }, [appleMutation]);

  return (
    <AuthContext.Provider value={{
      user,
      accessToken,
      isLoading: isLoading || (!!accessToken && !user && !isError),
      login,
      register,
      loginWithGoogle,
      loginWithApple,
      logout: handleLogout,
      setUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
