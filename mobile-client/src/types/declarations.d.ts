declare module '@expo/vector-icons' {
  import { ComponentType } from 'react';
  import { TextStyle, ViewProps } from 'react-native';

  interface IconProps extends ViewProps {
    name: string;
    size?: number;
    color?: string;
    style?: TextStyle;
  }

  export const Ionicons: ComponentType<IconProps> & { glyphMap: Record<string, number> };
  export const MaterialIcons: ComponentType<IconProps> & { glyphMap: Record<string, number> };
  export const FontAwesome: ComponentType<IconProps> & { glyphMap: Record<string, number> };
  export const Feather: ComponentType<IconProps> & { glyphMap: Record<string, number> };
}

declare module '@react-navigation/native' {
  export * from '@react-navigation/core';
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export type RouteProp<T, K extends keyof T> = { params: T[K] };
  export type NavigatorScreenParams<T> = Partial<T>;
}

declare module 'expo-image' {
  import { ComponentType } from 'react';
  import { ImageStyle, ViewProps } from 'react-native';

  interface ImageProps extends ViewProps {
    source: { uri: string } | number;
    style?: ImageStyle;
    contentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
    transition?: number;
    placeholder?: string | number;
    placeholderContentFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  }

  export const Image: ComponentType<ImageProps>;
}

declare module 'expo-notifications' {
  export interface NotificationContentInput {
    title?: string;
    subtitle?: string;
    body?: string;
    data?: Record<string, any>;
    badge?: number;
    sound?: boolean | string;
  }

  export interface NotificationTriggerInput {
    type?: 'timeInterval' | 'date' | 'daily' | 'weekly';
    seconds?: number;
    repeats?: boolean;
  }

  export interface ExpoPushToken {
    type: 'expo';
    data: string;
  }

  export function setNotificationHandler(handler: {
    handleNotification: (notification: any) => Promise<{
      shouldShowAlert: boolean;
      shouldPlaySound: boolean;
      shouldSetBadge: boolean;
    }>;
  }): void;

  export function getPermissionsAsync(): Promise<{ status: string }>;
  export function requestPermissionsAsync(): Promise<{ status: string }>;
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<ExpoPushToken>;
  export function setNotificationChannelAsync(id: string, options: any): Promise<void>;
  export function scheduleNotificationAsync(options: {
    content: NotificationContentInput;
    trigger: NotificationTriggerInput | null;
  }): Promise<string>;
  export function cancelScheduledNotificationAsync(id: string): Promise<void>;
  export function addNotificationReceivedListener(listener: (notification: any) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void };
}
