import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  image?: string;
}

export interface SelectedCustomization {
  customizationId: string;
  optionId: string;
  optionName: string;
  priceModifier: number;
}

export interface CartItem {
  id: string;
  menuItemId: string;
  menuItemName: string;
  restaurantId: string;
  restaurantName: string;
  price: number;
  quantity: number;
  image?: string;
  customizations?: SelectedCustomization[];
  subtotal: number;
}

interface CartStore {
  items: CartItem[];
  isOpen: boolean;
  addItem: (item: CartItem) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
  getDeliveryFee: () => number;
  getTax: () => number;
  getGrandTotal: () => number;
  canCheckout: () => boolean;
  getRestaurantId: () => string | null;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,

      addItem: (item) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          (i) =>
            i.menuItemId === item.menuItemId &&
            JSON.stringify(i.customizations) === JSON.stringify(item.customizations)
        );

        if (existingItemIndex !== -1) {
          const existingItem = items[existingItemIndex];
          const updatedItem = {
            ...existingItem,
            quantity: existingItem.quantity + item.quantity,
            subtotal: existingItem.price * (existingItem.quantity + item.quantity),
          };
          const newItems = [...items];
          newItems[existingItemIndex] = updatedItem;
          set({ items: newItems });
        } else {
          const newItem = {
            ...item,
            subtotal: item.price * item.quantity,
          };
          set({ items: [...items, newItem] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter((item) => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        set({
          items: get().items.map((item) =>
            item.id === id
              ? { ...item, quantity, subtotal: item.price * quantity }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      toggleCart: () => {
        set({ isOpen: !get().isOpen });
      },

      openCart: () => {
        set({ isOpen: true });
      },

      closeCart: () => {
        set({ isOpen: false });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce(
          (total, item) => total + item.subtotal,
          0
        );
      },

      getItemCount: () => {
        return get().items.length;
      },

      getDeliveryFee: () => {
        // This would typically come from restaurant data
        // For now, return a default or calculate based on restaurant
        const items = get().items;
        if (items.length === 0) return 0;
        return items[0].restaurantId ? 5.99 : 0; // Default delivery fee
      },

      getTax: () => {
        const subtotal = get().getTotalPrice();
        return subtotal * 0.08; // 8% tax rate
      },

      getGrandTotal: () => {
        return get().getTotalPrice() + get().getDeliveryFee() + get().getTax();
      },

      canCheckout: () => {
        return get().items.length > 0;
      },

      getRestaurantId: () => {
        const items = get().items;
        if (items.length === 0) return null;
        return items[0].restaurantId;
      },
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items }),
    }
  )
);
