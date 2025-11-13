import { createContext, useContext, ReactNode } from 'react';
import { useCartStore, CartItem, SelectedCustomization } from '../store/cartStore';
import { MenuItem } from '../store/cartStore';
import { createCartItem } from '../utils/cartUtils';

interface CartContextType {
  items: CartItem[];
  isOpen: boolean;
  addItem: (menuItem: MenuItem, restaurantId: string, restaurantName: string, quantity?: number, customizations?: SelectedCustomization[]) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
  getItemCount: () => number;
  getDeliveryFee: () => number;
  getTax: () => number;
  getGrandTotal: () => number;
  canCheckout: () => boolean;
  getRestaurantId: () => string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const store = useCartStore();

  const addItemWithMenuItem = (
    menuItem: MenuItem,
    restaurantId: string,
    restaurantName: string,
    quantity: number = 1,
    customizations?: SelectedCustomization[]
  ) => {
    const cartItem = createCartItem(menuItem, restaurantId, restaurantName, quantity, customizations);
    store.addItem(cartItem);
  };

  const value: CartContextType = {
    items: store.items,
    isOpen: store.isOpen,
    addItem: addItemWithMenuItem,
    removeItem: store.removeItem,
    updateQuantity: store.updateQuantity,
    clearCart: store.clearCart,
    openCart: store.openCart,
    closeCart: store.closeCart,
    toggleCart: store.toggleCart,
    getTotalItems: store.getTotalItems,
    getTotalPrice: store.getTotalPrice,
    getItemCount: store.getItemCount,
    getDeliveryFee: store.getDeliveryFee,
    getTax: store.getTax,
    getGrandTotal: store.getGrandTotal,
    canCheckout: store.canCheckout,
    getRestaurantId: store.getRestaurantId,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
