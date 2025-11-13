import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../contexts/CartContext';
import { orderService } from '../services/orderService';
import { toast } from 'react-toastify';
import { formatPrice } from '../utils/cartUtils';

export function Checkout() {
  const navigate = useNavigate();
  const { items, getTotalPrice, getDeliveryFee, getTax, getGrandTotal, clearCart, getRestaurantId } = useCart();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'USA',
    instructions: '',
    paymentMethod: 'cash_on_delivery' as 'card' | 'digital_wallet' | 'cash_on_delivery',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const restaurantId = getRestaurantId();
      if (!restaurantId) {
        toast.error('No restaurant selected');
        return;
      }

      const orderData = {
        restaurantId,
        items: items.map((item) => ({
          menuItemId: item.menuItemId,
          quantity: item.quantity,
          customizations: item.customizations?.map((c) => ({
            customizationId: c.customizationId,
            optionId: c.optionId,
            optionName: c.optionName,
            priceModifier: c.priceModifier,
          })),
        })),
        deliveryAddress: {
          street: formData.street,
          city: formData.city,
          state: formData.state,
          zipCode: formData.zipCode,
          country: formData.country,
          instructions: formData.instructions || undefined,
        },
        paymentMethod: formData.paymentMethod,
      };

      const response = await orderService.createOrder(orderData);

      if (response.success) {
        clearCart();
        toast.success('Order placed successfully!');
        navigate(`/orders/${response.data.id}`);
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to place order');
    } finally {
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-700 mb-2">No items to checkout</h2>
        <p className="text-gray-500 mb-6">Your cart is empty</p>
        <button onClick={() => navigate('/restaurants')} className="btn-primary">
          Browse Restaurants
        </button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8">Checkout</h1>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Delivery and payment form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <h2 className="text-2xl font-bold mb-4">Delivery Address</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="label">Street Address *</label>
                  <input
                    type="text"
                    name="street"
                    className="input"
                    value={formData.street}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">City *</label>
                  <input
                    type="text"
                    name="city"
                    className="input"
                    value={formData.city}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">State *</label>
                  <input
                    type="text"
                    name="state"
                    className="input"
                    value={formData.state}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">ZIP Code *</label>
                  <input
                    type="text"
                    name="zipCode"
                    className="input"
                    value={formData.zipCode}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div>
                  <label className="label">Country *</label>
                  <select
                    name="country"
                    className="input"
                    value={formData.country}
                    onChange={handleChange}
                    required
                  >
                    <option value="USA">United States</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="label">Delivery Instructions (Optional)</label>
                  <textarea
                    name="instructions"
                    className="input"
                    rows={3}
                    value={formData.instructions}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-2xl font-bold mb-4">Payment Method</h2>
              <div className="space-y-3">
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cash_on_delivery"
                    checked={formData.paymentMethod === 'cash_on_delivery'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span>Cash on Delivery</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={formData.paymentMethod === 'card'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span>Credit/Debit Card</span>
                </label>
                <label className="flex items-center p-4 border rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="digital_wallet"
                    checked={formData.paymentMethod === 'digital_wallet'}
                    onChange={handleChange}
                    className="mr-3"
                  />
                  <span>Digital Wallet (Apple Pay, Google Pay)</span>
                </label>
              </div>
            </div>
          </div>

          {/* Order summary */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h2 className="text-2xl font-bold mb-6">Order Summary</h2>
              <div className="space-y-3 mb-6">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItemName}
                    </span>
                    <span className="font-semibold">
                      {formatPrice(item.subtotal)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="space-y-3 mb-6 border-t pt-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatPrice(getTotalPrice())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Delivery Fee</span>
                  <span className="font-semibold">{formatPrice(getDeliveryFee())}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax</span>
                  <span className="font-semibold">{formatPrice(getTax())}</span>
                </div>
                <div className="flex justify-between text-xl font-bold border-t pt-3">
                  <span>Total</span>
                  <span>{formatPrice(getGrandTotal())}</span>
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full"
              >
                {loading ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
