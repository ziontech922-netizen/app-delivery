import { create } from 'zustand';
import { DeliveryOrder, Location } from '../types';

interface DeliveryState {
  currentDelivery: DeliveryOrder | null;
  currentLocation: Location | null;
  isOnline: boolean;
  isNavigating: boolean;
  navigationTarget: 'restaurant' | 'customer' | null;

  // Actions
  setCurrentDelivery: (delivery: DeliveryOrder | null) => void;
  updateDeliveryStatus: (status: DeliveryOrder['status']) => void;
  setCurrentLocation: (location: Location) => void;
  setOnline: (online: boolean) => void;
  startNavigation: (target: 'restaurant' | 'customer') => void;
  stopNavigation: () => void;
  clearDelivery: () => void;
}

export const useDeliveryStore = create<DeliveryState>((set) => ({
  currentDelivery: null,
  currentLocation: null,
  isOnline: false,
  isNavigating: false,
  navigationTarget: null,

  setCurrentDelivery: (delivery) => {
    set({ currentDelivery: delivery });
  },

  updateDeliveryStatus: (status) => {
    set((state) => ({
      currentDelivery: state.currentDelivery
        ? { ...state.currentDelivery, status }
        : null,
    }));
  },

  setCurrentLocation: (location) => {
    set({ currentLocation: location });
  },

  setOnline: (online) => {
    set({ isOnline: online });
  },

  startNavigation: (target) => {
    set({ isNavigating: true, navigationTarget: target });
  },

  stopNavigation: () => {
    set({ isNavigating: false, navigationTarget: null });
  },

  clearDelivery: () => {
    set({
      currentDelivery: null,
      isNavigating: false,
      navigationTarget: null,
    });
  },
}));
