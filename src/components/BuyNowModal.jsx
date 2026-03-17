import { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import { orderAPI } from '../services/api.js';

export default function BuyNowModal({ medicine, isOpen, onClose, onOrderSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Guard against null medicine
  if (!isOpen || !medicine) return null;

  const totalPrice = quantity * medicine.price;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    // Validation
    if (!shippingAddress.trim()) {
      setError('Shipping address is required');
      return;
    }

    if (quantity < 1 || quantity > medicine.qty) {
      setError(`Quantity must be between 1 and ${medicine.qty}`);
      return;
    }

    setIsLoading(true);

    try {
      const orderData = {
        medicineName: medicine.name,
        medicineType: medicine.type,
        quantity: parseInt(quantity),
        pricePerUnit: medicine.price,
        expiryDate: medicine.expiry,
        paymentMethod,
        shippingAddress: shippingAddress.trim(),
        notes: notes.trim()
      };

      const response = await orderAPI.createOrder(orderData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          onOrderSuccess?.();
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || 'Failed to create order. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#d6ebe4] bg-white rounded-t-2xl">
          <h2 className="text-2xl font-semibold text-[#1f3d3a]">Buy Medicine</h2>
          <button
            onClick={onClose}
            className="text-[#6b8781] hover:text-[#1f3d3a] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Medicine Summary */}
          <div className="mb-6 p-4 rounded-xl bg-[#f0f8f5] border border-[#d6ebe4]">
            <h3 className="font-semibold text-[#223f3a] text-lg">{medicine.name}</h3>
            <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-[#6b8781]">Type</p>
                <p className="font-medium text-[#1f3d3a]">{medicine.type}</p>
              </div>
              <div>
                <p className="text-[#6b8781]">Price</p>
                <p className="font-medium text-[#1f3d3a]">Rs {medicine.price}</p>
              </div>
              <div>
                <p className="text-[#6b8781]">Available</p>
                <p className="font-medium text-[#1f3d3a]">{medicine.qty} units</p>
              </div>
              <div>
                <p className="text-[#6b8781]">Expiry</p>
                <p className="font-medium text-[#1f3d3a]">{medicine.expiry}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 flex gap-2">
              <AlertCircle size={20} className="text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Success Message */}
          {success && (
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200">
              <p className="text-sm text-green-700 font-medium">✓ Order placed successfully!</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Quantity */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Quantity <span className="text-red-600">*</span>
              </label>
              <input
                type="number"
                min="1"
                max={medicine.qty}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82]"
              />
              <p className="text-xs text-[#6b8781] mt-1">
                Max: {medicine.qty} units
              </p>
            </div>

            {/* Total Price */}
            <div className="p-3 rounded-lg bg-[#f0f8f5] border border-[#d6ebe4]">
              <p className="text-sm text-[#6b8781]">Total Price</p>
              <p className="text-2xl font-bold text-[#1f3d3a]">Rs {totalPrice}</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Payment Method <span className="text-red-600">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82]"
              >
                <option value="cod">Cash on Delivery</option>
                <option value="upi">UPI</option>
                <option value="card">Debit/Credit Card</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>

            {/* Shipping Address */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Shipping Address <span className="text-red-600">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter complete shipping address..."
                rows="3"
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Additional Notes
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests? (optional)"
                rows="2"
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] resize-none"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d3e7e0] text-[#3d5f57] font-medium hover:bg-[#ecf7f3] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#37aa82] to-[#2e9d79] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isLoading ? 'Placing Order...' : success ? '✓ Order Placed' : 'Place Order'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
