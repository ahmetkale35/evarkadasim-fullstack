import { useState, useEffect } from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';
import { authService } from '@/services/authService';
import { authEvents } from '@/services/authEvents';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useFrameworkReady();

  useEffect(() => {
    // Herhangi bir ekrandan 401 gelirse login ekranına dön
    const unsubscribe = authEvents.onUnauthorized(() => setIsAuthenticated(false));
    return () => { unsubscribe(); };
  }, []);

  const handleLoadingFinish = async () => {
    try {
      const loggedIn = await authService.isLoggedIn();
      setIsAuthenticated(loggedIn);
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
  };

  // Eğer loading gösteriliyorsa loading screen'i göster
  if (isLoading) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <LoadingScreen onFinish={handleLoadingFinish} />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    );
  }

  // Eğer kullanıcı giriş yapmamışsa auth screen'i göster
  if (!isAuthenticated) {
    return (
      <GestureHandlerRootView style={{ flex: 1 }}>
        <AuthScreen onAuthSuccess={handleAuthSuccess} />
        <StatusBar style="auto" />
      </GestureHandlerRootView>
    );
  }

  // Kullanıcı giriş yaptıysa tab navigasyonuna yönlendir
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="+not-found" />
      </Stack>
      <Redirect href="/(tabs)" />
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
