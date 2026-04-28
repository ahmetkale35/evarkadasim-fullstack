import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { LoadingScreen } from '@/components/LoadingScreen';
import { AuthScreen } from '@/components/AuthScreen';

export default function RootLayout() {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [frameworkReady, setFrameworkReady] = useState(false);

  useFrameworkReady();

  useEffect(() => {
    // Framework hazır olduğunda işaretle
    setFrameworkReady(true);
  }, []);

  const handleLoadingFinish = () => {
    setIsLoading(false);
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

  // Kullanıcı giriş yaptıysa ana uygulamayı göster
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="+not-found" />
      </Stack>
      <StatusBar style="auto" />
    </GestureHandlerRootView>
  );
}
