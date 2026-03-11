// React Native types
declare module 'react-native' {
  import { ComponentType, ReactNode } from 'react';

  export interface ViewStyle {
    flex?: number;
    flexDirection?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
    justifyContent?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
    alignItems?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    alignSelf?: 'auto' | 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
    position?: 'absolute' | 'relative';
    top?: number | string;
    bottom?: number | string;
    left?: number | string;
    right?: number | string;
    margin?: number | string;
    marginTop?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    marginRight?: number | string;
    marginHorizontal?: number | string;
    marginVertical?: number | string;
    padding?: number | string;
    paddingTop?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    paddingRight?: number | string;
    paddingHorizontal?: number | string;
    paddingVertical?: number | string;
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;
    backgroundColor?: string;
    borderRadius?: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomLeftRadius?: number;
    borderBottomRightRadius?: number;
    borderWidth?: number;
    borderTopWidth?: number;
    borderBottomWidth?: number;
    borderLeftWidth?: number;
    borderRightWidth?: number;
    borderColor?: string;
    borderTopColor?: string;
    borderBottomColor?: string;
    borderLeftColor?: string;
    borderRightColor?: string;
    borderStyle?: 'solid' | 'dotted' | 'dashed';
    shadowColor?: string;
    shadowOffset?: { width: number; height: number };
    shadowOpacity?: number;
    shadowRadius?: number;
    elevation?: number;
    opacity?: number;
    overflow?: 'visible' | 'hidden' | 'scroll';
    gap?: number;
    rowGap?: number;
    columnGap?: number;
    zIndex?: number;
    [key: string]: any;
  }

  export interface TextStyle extends ViewStyle {
    color?: string;
    fontSize?: number;
    fontWeight?: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
    fontFamily?: string;
    fontStyle?: 'normal' | 'italic';
    textAlign?: 'auto' | 'left' | 'right' | 'center' | 'justify';
    textDecorationLine?: 'none' | 'underline' | 'line-through' | 'underline line-through';
    textTransform?: 'none' | 'capitalize' | 'uppercase' | 'lowercase';
    lineHeight?: number;
    letterSpacing?: number;
    includeFontPadding?: boolean;
    textAlignVertical?: 'auto' | 'top' | 'bottom' | 'center';
  }

  export interface ImageStyle extends ViewStyle {
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    tintColor?: string;
  }

  export interface ViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
    onLayout?: (event: any) => void;
    testID?: string;
    accessibilityLabel?: string;
    pointerEvents?: 'auto' | 'none' | 'box-none' | 'box-only';
    [key: string]: any;
  }

  export interface TextProps {
    style?: TextStyle | TextStyle[];
    children?: ReactNode;
    numberOfLines?: number;
    ellipsizeMode?: 'head' | 'middle' | 'tail' | 'clip';
    onPress?: () => void;
    selectable?: boolean;
    [key: string]: any;
  }

  export interface TextInputProps {
    style?: TextStyle | TextStyle[];
    value?: string;
    onChangeText?: (text: string) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad' | 'number-pad' | 'decimal-pad';
    autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
    autoCorrect?: boolean;
    autoFocus?: boolean;
    secureTextEntry?: boolean;
    multiline?: boolean;
    numberOfLines?: number;
    maxLength?: number;
    editable?: boolean;
    returnKeyType?: 'done' | 'go' | 'next' | 'search' | 'send' | 'default';
    onSubmitEditing?: () => void;
    onFocus?: () => void;
    onBlur?: () => void;
    [key: string]: any;
  }

  export interface TouchableOpacityProps extends ViewProps {
    onPress?: () => void;
    onLongPress?: () => void;
    disabled?: boolean;
    activeOpacity?: number;
  }

  export interface ScrollViewProps extends ViewProps {
    contentContainerStyle?: ViewStyle;
    horizontal?: boolean;
    showsHorizontalScrollIndicator?: boolean;
    showsVerticalScrollIndicator?: boolean;
    refreshControl?: ReactNode;
    keyboardShouldPersistTaps?: 'always' | 'never' | 'handled';
    keyboardDismissMode?: 'none' | 'on-drag' | 'interactive';
    bounces?: boolean;
    scrollEnabled?: boolean;
  }

  export interface FlatListProps<T> {
    data: T[];
    renderItem: (info: { item: T; index: number }) => ReactNode;
    keyExtractor?: (item: T, index: number) => string;
    style?: ViewStyle;
    contentContainerStyle?: ViewStyle;
    ListEmptyComponent?: ReactNode;
    ListHeaderComponent?: ReactNode;
    ListFooterComponent?: ReactNode;
    refreshControl?: ReactNode;
    horizontal?: boolean;
    numColumns?: number;
    ItemSeparatorComponent?: ReactNode;
    onEndReached?: () => void;
    onEndReachedThreshold?: number;
    [key: string]: any;
  }

  export interface SwitchProps {
    value?: boolean;
    onValueChange?: (value: boolean) => void;
    disabled?: boolean;
    trackColor?: { true?: string; false?: string };
    thumbColor?: string;
    ios_backgroundColor?: string;
    [key: string]: any;
  }

  export interface ImageProps {
    source: { uri: string } | number;
    style?: ImageStyle | ImageStyle[];
    resizeMode?: 'cover' | 'contain' | 'stretch' | 'repeat' | 'center';
    onLoad?: () => void;
    onError?: () => void;
    [key: string]: any;
  }

  export interface RefreshControlProps {
    refreshing: boolean;
    onRefresh: () => void;
    colors?: string[];
    tintColor?: string;
    title?: string;
    titleColor?: string;
    [key: string]: any;
  }

  export interface ActivityIndicatorProps {
    size?: 'small' | 'large' | number;
    color?: string;
    animating?: boolean;
    [key: string]: any;
  }

  export interface AlertButton {
    text?: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }

  export interface AlertStatic {
    alert: (title: string, message?: string, buttons?: AlertButton[], options?: any) => void;
  }

  export interface LinkingStatic {
    openURL: (url: string) => Promise<void>;
    canOpenURL: (url: string) => Promise<boolean>;
    openSettings: () => Promise<void>;
  }

  export interface PlatformStatic {
    OS: 'ios' | 'android' | 'web' | 'windows' | 'macos';
    Version: string | number;
    select: <T>(specifics: { ios?: T; android?: T; web?: T; default?: T }) => T | undefined;
  }

  export interface DimensionsStatic {
    get: (dim: 'window' | 'screen') => { width: number; height: number; scale: number; fontScale: number };
    addEventListener: (type: 'change', handler: (dims: any) => void) => { remove: () => void };
  }

  export interface StyleSheetStatic {
    create: <T extends Record<string, ViewStyle | TextStyle | ImageStyle>>(styles: T) => T;
    flatten: (style: any) => ViewStyle | TextStyle | ImageStyle;
    absoluteFillObject: ViewStyle;
    hairlineWidth: number;
  }

  export interface KeyboardAvoidingViewProps extends ViewProps {
    behavior?: 'height' | 'position' | 'padding';
    keyboardVerticalOffset?: number;
    contentContainerStyle?: ViewStyle;
  }

  export const View: ComponentType<ViewProps>;
  export const Text: ComponentType<TextProps>;
  export const TextInput: ComponentType<TextInputProps>;
  export const TouchableOpacity: ComponentType<TouchableOpacityProps>;
  export const ScrollView: ComponentType<ScrollViewProps>;
  export const FlatList: <T>(props: FlatListProps<T>) => JSX.Element;
  export const Switch: ComponentType<SwitchProps>;
  export const Image: ComponentType<ImageProps>;
  export const RefreshControl: ComponentType<RefreshControlProps>;
  export const ActivityIndicator: ComponentType<ActivityIndicatorProps>;
  export const KeyboardAvoidingView: ComponentType<KeyboardAvoidingViewProps>;
  export const Alert: AlertStatic;
  export const Linking: LinkingStatic;
  export const Platform: PlatformStatic;
  export const Dimensions: DimensionsStatic;
  export const StyleSheet: StyleSheetStatic;
}

declare module 'react-native-safe-area-context' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewStyle } from 'react-native';

  export interface SafeAreaViewProps {
    style?: ViewStyle | ViewStyle[];
    children?: ReactNode;
    edges?: Array<'top' | 'right' | 'bottom' | 'left'>;
    mode?: 'padding' | 'margin';
  }

  export interface SafeAreaProviderProps {
    children?: ReactNode;
    initialMetrics?: any;
  }

  export interface SafeAreaInsets {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  export const SafeAreaView: ComponentType<SafeAreaViewProps>;
  export const SafeAreaProvider: ComponentType<SafeAreaProviderProps>;
  export function useSafeAreaInsets(): SafeAreaInsets;
}

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
  import { ComponentType, ReactNode } from 'react';
  export * from '@react-navigation/core';
  export function useNavigation<T = any>(): T;
  export function useRoute<T = any>(): T;
  export type RouteProp<T, K extends keyof T> = { params: T[K] };
  export type NavigatorScreenParams<T> = Partial<T>;
  
  interface NavigationContainerProps {
    children?: ReactNode;
    theme?: any;
    linking?: any;
    fallback?: ReactNode;
    documentTitle?: any;
    onReady?: () => void;
    onStateChange?: (state: any) => void;
  }
  
  export const NavigationContainer: ComponentType<NavigationContainerProps>;
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
  }

  export const Image: ComponentType<ImageProps>;
}

declare module 'expo-notifications' {
  export interface NotificationContentInput {
    title?: string;
    body?: string;
    data?: Record<string, any>;
    sound?: boolean | string;
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
  export function getExpoPushTokenAsync(options?: { projectId?: string }): Promise<{ data: string }>;
  export function setNotificationChannelAsync(id: string, options: any): Promise<void>;
  export function addNotificationReceivedListener(listener: (notification: any) => void): { remove: () => void };
  export function addNotificationResponseReceivedListener(listener: (response: any) => void): { remove: () => void };
}

declare module 'expo-location' {
  export interface LocationObject {
    coords: {
      latitude: number;
      longitude: number;
      altitude: number | null;
      accuracy: number | null;
      heading: number | null;
      speed: number | null;
    };
    timestamp: number;
  }

  export interface LocationSubscription {
    remove: () => void;
  }

  export const Accuracy: {
    Lowest: number;
    Low: number;
    Balanced: number;
    High: number;
    Highest: number;
    BestForNavigation: number;
  };

  export function requestForegroundPermissionsAsync(): Promise<{ status: string }>;
  export function requestBackgroundPermissionsAsync(): Promise<{ status: string }>;
  export function getCurrentPositionAsync(options?: any): Promise<LocationObject>;
  export function watchPositionAsync(options: any, callback: (location: LocationObject) => void): Promise<LocationSubscription>;
  export function startLocationUpdatesAsync(taskName: string, options: any): Promise<void>;
  export function stopLocationUpdatesAsync(taskName: string): Promise<void>;
}

declare module 'react-native-maps' {
  import { ComponentType, Ref } from 'react';
  import { ViewProps, ViewStyle } from 'react-native';

  interface Region {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  }

  interface LatLng {
    latitude: number;
    longitude: number;
  }

  interface EdgePadding {
    top: number;
    right: number;
    bottom: number;
    left: number;
  }

  interface MapViewProps extends ViewProps {
    style?: ViewStyle;
    region?: Region;
    initialRegion?: Region;
    showsUserLocation?: boolean;
    showsMyLocationButton?: boolean;
    followsUserLocation?: boolean;
    provider?: 'google' | null;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    ref?: Ref<MapViewRef>;
  }

  interface MapViewRef {
    fitToCoordinates: (coordinates: LatLng[], options?: { edgePadding?: EdgePadding; animated?: boolean }) => void;
    animateToRegion: (region: Region, duration?: number) => void;
  }

  interface MarkerProps extends ViewProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
    children?: React.ReactNode;
  }

  interface PolylineProps extends ViewProps {
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
    lineDashPattern?: number[];
  }

  export const Marker: ComponentType<MarkerProps>;
  export const Polyline: ComponentType<PolylineProps>;
  export const PROVIDER_GOOGLE: string;

  const MapView: ComponentType<MapViewProps>;
  export default MapView;
}

declare module 'react-native-gesture-handler' {
  import { ComponentType, ReactNode } from 'react';
  import { ViewProps, ViewStyle } from 'react-native';

  interface GestureHandlerRootViewProps extends ViewProps {
    children?: ReactNode;
    style?: ViewStyle;
  }

  export const GestureHandlerRootView: ComponentType<GestureHandlerRootViewProps>;
}

declare module 'expo-image-picker' {
  export interface ImagePickerResult {
    canceled: boolean;
    assets?: Array<{
      uri: string;
      width: number;
      height: number;
      type?: 'image' | 'video';
    }>;
  }

  export interface ImagePickerOptions {
    mediaTypes?: MediaTypeOptions;
    allowsEditing?: boolean;
    aspect?: [number, number];
    quality?: number;
  }

  export enum MediaTypeOptions {
    All = 'All',
    Images = 'Images',
    Videos = 'Videos',
  }

  export function requestCameraPermissionsAsync(): Promise<{ granted: boolean; status: string }>;
  export function requestMediaLibraryPermissionsAsync(): Promise<{ granted: boolean; status: string }>;
  export function launchCameraAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
  export function launchImageLibraryAsync(options?: ImagePickerOptions): Promise<ImagePickerResult>;
}
