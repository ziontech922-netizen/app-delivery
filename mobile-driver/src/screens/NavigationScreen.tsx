import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Platform,
  Alert,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';

import { useDeliveryStore } from '../stores/deliveryStore';
import { deliveryService } from '../services/deliveryService';
import { locationService } from '../services/locationService';
import { RootStackParamList } from '../navigation/AppNavigator';
import { DeliveryOrder } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteType = RouteProp<RootStackParamList, 'Navigation'>;

const { width, height } = Dimensions.get('window');

export default function NavigationScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteType>();
  const mapRef = useRef<MapView>(null);

  const { currentDelivery, currentLocation, setCurrentLocation, startNavigation, stopNavigation } =
    useDeliveryStore();

  const [delivery, setDelivery] = useState<DeliveryOrder | null>(currentDelivery);

  useEffect(() => {
    loadDelivery();
    setupTracking();

    return () => {
      stopNavigation();
    };
  }, []);

  const loadDelivery = async () => {
    if (!currentDelivery) {
      try {
        const data = await deliveryService.getCurrentDelivery();
        setDelivery(data);
      } catch (error) {
        console.error('Error loading delivery:', error);
      }
    }
  };

  const setupTracking = async () => {
    const location = await locationService.getCurrentLocation();
    if (location) {
      setCurrentLocation(location);
    }

    locationService.startTracking((loc) => {
      setCurrentLocation(loc);
    });

    startNavigation('restaurant');
  };

  const getDestination = () => {
    if (!delivery) return null;

    if (delivery.status === 'ASSIGNED' || delivery.status === 'PREPARING') {
      return {
        type: 'restaurant' as const,
        name: delivery.restaurant.name,
        address: delivery.restaurant.address,
        latitude: delivery.restaurant.address.latitude || 0,
        longitude: delivery.restaurant.address.longitude || 0,
      };
    }

    return {
      type: 'customer' as const,
      name: delivery.customer.name,
      address: delivery.deliveryAddress,
      latitude: delivery.deliveryAddress.latitude || 0,
      longitude: delivery.deliveryAddress.longitude || 0,
    };
  };

  const destination = getDestination();

  const openMapsApp = () => {
    if (!destination) return;

    const { latitude, longitude } = destination;
    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}?daddr=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.openURL(url);
    }
  };

  const handleConfirmAction = () => {
    if (!delivery) return;

    const type = delivery.status === 'ASSIGNED' || delivery.status === 'PREPARING' 
      ? 'pickup' 
      : 'delivery';

    navigation.navigate('DeliveryConfirmation', { 
      orderId: delivery.id, 
      type 
    });
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const fitMapToMarkers = () => {
    if (!currentLocation || !destination) return;

    mapRef.current?.fitToCoordinates(
      [
        { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
        { latitude: destination.latitude, longitude: destination.longitude },
      ],
      {
        edgePadding: { top: 100, right: 50, bottom: 200, left: 50 },
        animated: true,
      }
    );
  };

  useEffect(() => {
    if (currentLocation && destination) {
      fitMapToMarkers();
    }
  }, [currentLocation, destination]);

  if (!delivery || !destination) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Carregando...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const isPickup = delivery.status === 'ASSIGNED' || delivery.status === 'PREPARING';

  return (
    <View style={styles.container}>
      {/* Map */}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        showsUserLocation
        showsMyLocationButton={false}
        initialRegion={{
          latitude: currentLocation?.latitude || destination.latitude,
          longitude: currentLocation?.longitude || destination.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
      >
        {/* Destination Marker */}
        <Marker
          coordinate={{
            latitude: destination.latitude,
            longitude: destination.longitude,
          }}
          title={destination.name}
        >
          <View style={[styles.markerContainer, isPickup ? styles.markerBlue : styles.markerGreen]}>
            <Ionicons
              name={isPickup ? 'restaurant' : 'home'}
              size={20}
              color="#ffffff"
            />
          </View>
        </Marker>

        {/* Route line */}
        {currentLocation && (
          <Polyline
            coordinates={[
              { latitude: currentLocation.latitude, longitude: currentLocation.longitude },
              { latitude: destination.latitude, longitude: destination.longitude },
            ]}
            strokeColor={isPickup ? '#3b82f6' : '#16a34a'}
            strokeWidth={4}
            lineDashPattern={[1]}
          />
        )}
      </MapView>

      {/* Header */}
      <SafeAreaView style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="close" size={24} color="#374151" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.centerButton} onPress={fitMapToMarkers}>
          <Ionicons name="locate" size={24} color="#374151" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.destinationInfo}>
          <View style={[styles.iconCircle, isPickup ? styles.iconBlue : styles.iconGreen]}>
            <Ionicons
              name={isPickup ? 'restaurant' : 'home'}
              size={24}
              color="#ffffff"
            />
          </View>
          <View style={styles.destinationText}>
            <Text style={styles.destinationType}>
              {isPickup ? 'Retirar em' : 'Entregar para'}
            </Text>
            <Text style={styles.destinationName}>{destination.name}</Text>
            <Text style={styles.destinationAddress} numberOfLines={1}>
              {destination.address.street}, {destination.address.number}
            </Text>
          </View>
        </View>

        {/* Distance info */}
        {currentLocation && (
          <View style={styles.distanceInfo}>
            <View style={styles.distanceItem}>
              <Ionicons name="location-outline" size={20} color="#6b7280" />
              <Text style={styles.distanceText}>
                {locationService.formatDistance(
                  locationService.calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    destination.latitude,
                    destination.longitude
                  )
                )}
              </Text>
            </View>
            <View style={styles.distanceItem}>
              <Ionicons name="time-outline" size={20} color="#6b7280" />
              <Text style={styles.distanceText}>
                ~{locationService.estimateTime(
                  locationService.calculateDistance(
                    currentLocation.latitude,
                    currentLocation.longitude,
                    destination.latitude,
                    destination.longitude
                  )
                )} min
              </Text>
            </View>
          </View>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity style={styles.actionButton} onPress={openMapsApp}>
            <Ionicons name="navigate" size={24} color="#16a34a" />
            <Text style={styles.actionButtonText}>Navegar</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              handleCall(isPickup ? delivery.restaurant.phone || '' : delivery.customer.phone || '')
            }
          >
            <Ionicons name="call" size={24} color="#16a34a" />
            <Text style={styles.actionButtonText}>Ligar</Text>
          </TouchableOpacity>
        </View>

        {/* Main action button */}
        <TouchableOpacity style={styles.confirmButton} onPress={handleConfirmAction}>
          <Text style={styles.confirmButtonText}>
            {isPickup ? 'Confirmar retirada' : 'Confirmar entrega'}
          </Text>
          <Ionicons name="chevron-forward" size={24} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  map: {
    width,
    height,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  centerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  markerContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  markerBlue: {
    backgroundColor: '#3b82f6',
  },
  markerGreen: {
    backgroundColor: '#16a34a',
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  destinationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  iconBlue: {
    backgroundColor: '#3b82f6',
  },
  iconGreen: {
    backgroundColor: '#16a34a',
  },
  destinationText: {
    flex: 1,
  },
  destinationType: {
    fontSize: 12,
    color: '#6b7280',
  },
  destinationName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  destinationAddress: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  distanceInfo: {
    flexDirection: 'row',
    gap: 24,
    marginBottom: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#e5e7eb',
  },
  distanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  distanceText: {
    fontSize: 16,
    color: '#374151',
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#16a34a',
  },
  confirmButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 16,
    gap: 8,
  },
  confirmButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
});
