import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CartItem, Cart } from '../types';

interface CartState {
  cart: Cart | null;
  
  // Actions
  addItem: (item: Omit<CartItem, 'id' | 'totalPrice'>, restaurantId: string, restaurantName: string) => void;
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  setItemNotes: (itemId: string, notes: string) => void;
  clearCart: () => void;
  setDeliveryFee: (fee: number) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 9);

const calculateTotals = (items: CartItem[], deliveryFee: number) => {
  const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
  return {
    subtotal,
    deliveryFee,
    total: subtotal + deliveryFee,
  };
};

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      cart: null,

      addItem: (item, restaurantId, restaurantName) => {
        const currentCart = get().cart;
        
        // If adding from different restaurant, clear cart
        if (currentCart && currentCart.restaurantId !== restaurantId) {
          const cartItem: CartItem = {
            ...item,
            id: generateId(),
            totalPrice: item.unitPrice * item.quantity,
          };
          
          const { subtotal, total } = calculateTotals([cartItem], 0);
          
          set({
            cart: {
              restaurantId,
              restaurantName,
              items: [cartItem],
              subtotal,
              deliveryFee: 0,
              total,
            },
          });
          return;
        }

        // Check if item already exists
        if (currentCart) {
          const existingItemIndex = currentCart.items.findIndex(
            (i) => i.productId === item.productId && i.notes === item.notes
          );

          if (existingItemIndex >= 0) {
            // Update quantity
            const updatedItems = [...currentCart.items];
            const existingItem = updatedItems[existingItemIndex];
            updatedItems[existingItemIndex] = {
              ...existingItem,
              quantity: existingItem.quantity + item.quantity,
              totalPrice: existingItem.unitPrice * (existingItem.quantity + item.quantity),
            };

            const { subtotal, total } = calculateTotals(updatedItems, currentCart.deliveryFee);
            
            set({
              cart: {
                ...currentCart,
                items: updatedItems,
                subtotal,
                total,
              },
            });
            return;
          }
        }

        // Add new item
        const cartItem: CartItem = {
          ...item,
          id: generateId(),
          totalPrice: item.unitPrice * item.quantity,
        };

        const items = currentCart ? [...currentCart.items, cartItem] : [cartItem];
        const deliveryFee = currentCart?.deliveryFee || 0;
        const { subtotal, total } = calculateTotals(items, deliveryFee);

        set({
          cart: {
            restaurantId,
            restaurantName,
            items,
            subtotal,
            deliveryFee,
            total,
          },
        });
      },

      updateQuantity: (itemId, quantity) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        if (quantity <= 0) {
          get().removeItem(itemId);
          return;
        }

        const updatedItems = currentCart.items.map((item) =>
          item.id === itemId
            ? { ...item, quantity, totalPrice: item.unitPrice * quantity }
            : item
        );

        const { subtotal, total } = calculateTotals(updatedItems, currentCart.deliveryFee);

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            subtotal,
            total,
          },
        });
      },

      removeItem: (itemId) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const updatedItems = currentCart.items.filter((item) => item.id !== itemId);

        if (updatedItems.length === 0) {
          set({ cart: null });
          return;
        }

        const { subtotal, total } = calculateTotals(updatedItems, currentCart.deliveryFee);

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
            subtotal,
            total,
          },
        });
      },

      setItemNotes: (itemId, notes) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const updatedItems = currentCart.items.map((item) =>
          item.id === itemId ? { ...item, notes } : item
        );

        set({
          cart: {
            ...currentCart,
            items: updatedItems,
          },
        });
      },

      clearCart: () => {
        set({ cart: null });
      },

      setDeliveryFee: (fee) => {
        const currentCart = get().cart;
        if (!currentCart) return;

        const { subtotal, total } = calculateTotals(currentCart.items, fee);

        set({
          cart: {
            ...currentCart,
            deliveryFee: fee,
            subtotal,
            total,
          },
        });
      },
    }),
    {
      name: 'cart-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
