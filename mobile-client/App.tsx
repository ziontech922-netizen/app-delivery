import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import RootNavigator from './src/navigation';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      staleTime: 1000 * 60 * 5,
    },
  },
});

function ErrorBoundary({ children }: { children: React.ReactNode }) {
  const [hasError, setHasError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const errorHandler = (e: ErrorEvent) => {
      setHasError(true);
      setError(new Error(e.message));
    };
    
    // @ts-ignore
    if (global.ErrorUtils) {
      // @ts-ignore
      const originalHandler = global.ErrorUtils.getGlobalHandler();
      // @ts-ignore
      global.ErrorUtils.setGlobalHandler((err: Error) => {
        setHasError(true);
        setError(err);
        originalHandler(err);
      });
    }
    
    return () => {};
  }, []);

  if (hasError) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>Erro no App</Text>
        <Text style={styles.errorText}>{error?.message || 'Erro desconhecido'}</Text>
      </View>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <NavigationContainer
            fallback={
              <View style={styles.loading}>
                <ActivityIndicator size="large" color="#FF6B35" />
              </View>
            }
          >
            <StatusBar style="auto" />
            <ErrorBoundary>
              <RootNavigator />
            </ErrorBoundary>
          </NavigationContainer>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 10,
  },
  errorText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
