import { v4 as uuidv4 } from 'uuid';
import { MenuItem, SelectedCustomization } from '../store/cartStore';

export function calculateItemTotal(
  price: number,
  quantity: number,
  customizations?: SelectedCustomization[]
): number {
  const customizationCost = customizations
    ? customizations.reduce((sum, c) => sum + c.priceModifier, 0)
    : 0;
  return (price + customizationCost) * quantity;
}

export function generateCartItemId(
  menuItemId: string,
  customizations?: SelectedCustomization[]
): string {
  // Create a unique ID based on item and its customizations
  const customizationString = customizations
    ? customizations.map((c) => `${c.optionId}`).sort().join(',')
    : '';
  return `${menuItemId}-${customizationString}-${uuidv4()}`;
}

export function formatPrice(price: number): string {
  return `$${price.toFixed(2)}`;
}

export function validateCartForRestaurant(
  cartRestaurantId: string | null,
  newRestaurantId: string
): boolean {
  if (!cartRestaurantId) return true; // Empty cart
  return cartRestaurantId === newRestaurantId;
}

export function getCustomizationSummary(customizations?: SelectedCustomization[]): string {
  if (!customizations || customizations.length === 0) return '';
  return customizations.map((c) => c.optionName).join(', ');
}

export function createCartItem(
  menuItem: MenuItem,
  restaurantId: string,
  restaurantName: string,
  quantity: number,
  customizations?: SelectedCustomization[]
) {
  const customizationCost = customizations
    ? customizations.reduce((sum, c) => sum + c.priceModifier, 0)
    : 0;
  const totalPrice = menuItem.price + customizationCost;

  return {
    id: generateCartItemId(menuItem.id, customizations),
    menuItemId: menuItem.id,
    menuItemName: menuItem.name,
    restaurantId,
    restaurantName,
    price: totalPrice,
    quantity,
    image: menuItem.image,
    customizations,
    subtotal: totalPrice * quantity,
  };
}
