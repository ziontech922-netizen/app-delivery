import * as Location from 'expo-location';
import { Platform, Alert, Linking } from 'react-native';
import { deliveryService } from './deliveryService';
import { socketService } from './socketService';

interface LocationCoords {
  latitude: number;
  longitude: number;
}

class LocationService {
  private watchSubscription: Location.LocationSubscription | null = null;
  private updateInterval: NodeJS.Timeout | null = null;
  private lastLocation: LocationCoords | null = null;

  async requestPermissions(): Promise<boolean> {
    try {
      // Request foreground permissions
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== 'granted') {
        Alert.alert(
          'Permissão Necessária',
          'O app precisa de acesso à localização para funcionar corretamente.',
          [
            { text: 'Cancelar', style: 'cancel' },
            { text: 'Abrir Configurações', onPress: () => Linking.openSettings() },
          ]
        );
        return false;
      }

      // Request background permissions on Android
      if (Platform.OS === 'android') {
        const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
        if (backgroundStatus !== 'granted') {
          Alert.alert(
            'Permissão de Localização',
            'Para melhor experiência durante entregas, permita acesso à localização "o tempo todo".',
            [
              { text: 'Continuar', style: 'cancel' },
              { text: 'Configurações', onPress: () => Linking.openSettings() },
            ]
          );
        }
      }

      return true;
    } catch (error) {
      console.error('Error requesting location permissions:', error);
      return false;
    }
  }

  async getCurrentLocation(): Promise<LocationCoords | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) return null;

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      this.lastLocation = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      };

      return this.lastLocation;
    } catch (error) {
      console.error('Error getting current location:', error);
      return null;
    }
  }

  async startTracking(
    onLocationUpdate: (location: LocationCoords) => void,
    intervalMs = 10000 // Update every 10 seconds
  ): Promise<void> {
    const hasPermission = await this.requestPermissions();
    if (!hasPermission) return;

    // Stop any existing tracking
    this.stopTracking();

    // Watch position changes
    this.watchSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.High,
        distanceInterval: 50, // Update every 50 meters
        timeInterval: 5000, // Or every 5 seconds
      },
      (location) => {
        this.lastLocation = {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        };
        onLocationUpdate(this.lastLocation);
      }
    );

    // Also set up interval for server updates
    this.updateInterval = setInterval(async () => {
      if (this.lastLocation) {
        try {
          // Update location on server
          await deliveryService.updateLocation(
            this.lastLocation.latitude,
            this.lastLocation.longitude
          );
          // Also update via socket for real-time
          socketService.updateLocation(
            this.lastLocation.latitude,
            this.lastLocation.longitude
          );
        } catch (error) {
          console.error('Error updating location on server:', error);
        }
      }
    }, intervalMs);
  }

  stopTracking(): void {
    if (this.watchSubscription) {
      this.watchSubscription.remove();
      this.watchSubscription = null;
    }
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
  }

  getLastLocation(): LocationCoords | null {
    return this.lastLocation;
  }

  // Calculate distance between two points in km
  calculateDistance(
    lat1: number,
    lon1: number,
    lat2: number,
    lon2: number
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) *
        Math.cos(this.toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  private toRad(deg: number): number {
    return deg * (Math.PI / 180);
  }

  // Format distance for display
  formatDistance(km: number): string {
    if (km < 1) {
      return `${Math.round(km * 1000)}m`;
    }
    return `${km.toFixed(1)}km`;
  }

  // Estimate time based on distance (assuming 30km/h average speed)
  estimateTime(distanceKm: number): number {
    const avgSpeedKmh = 30;
    return Math.ceil((distanceKm / avgSpeedKmh) * 60); // minutes
  }
}

export const locationService = new LocationService();
export default locationService;
