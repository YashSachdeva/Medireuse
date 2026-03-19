import { useState, useEffect } from 'react';
import { X, AlertCircle, Check } from 'lucide-react';
import { orderAPI } from '../services/api.js';

export default function BuyNowModal({ medicine, isOpen, onClose, onOrderSuccess }) {
  const [quantity, setQuantity] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Load Razorpay script
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  // Guard against null medicine - MUST be after hooks
  if (!isOpen || !medicine) return null;

  const totalPrice = quantity * medicine.price;

  const handleRazorpayPayment = async (e) => {
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

      // For Razorpay, we'll process payment first
      if (paymentMethod === 'card' || paymentMethod === 'upi') {
        if (!window.Razorpay) {
          setError('Payment gateway is loading. Please try again.');
          setIsLoading(false);
          return;
        }

        const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY_ID?.trim() || 'rzp_test_SSMwamxYHJ9vQj';
        
        // Initialize Razorpay payment
        const options = {
          key: razorpayKey,
          amount: totalPrice * 100,
          currency: 'INR',
          name: 'Medireuse',
          description: `${medicine.name} - ${quantity} unit(s)`,
          prefill: {
            name: localStorage.getItem('userName') || 'Customer',
            email: localStorage.getItem('userEmail') || '',
            contact: localStorage.getItem('userPhone') || ''
          },
          handler: async (response) => {
            try {
              orderData.paymentId = response.razorpay_payment_id;
              orderData.paymentSignature = response.razorpay_signature;

              const result = await orderAPI.createOrder(orderData);
              if (result.success) {
                setSuccess(true);
                setTimeout(() => {
                  onOrderSuccess?.();
                  onClose();
                }, 1500);
              } else {
                setError(result.error || 'Order creation failed. Please try again.');
                setIsLoading(false);
              }
            } catch (err) {
              setError('Payment successful but order creation failed. Please contact support.');
              setIsLoading(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsLoading(false);
              setError('Payment cancelled. Please try again.');
            }
          }
        };

        try {
          const razorpay = new window.Razorpay(options);
          razorpay.open();
        } catch (err) {
          console.error('Razorpay error:', err);
          setError(`Payment initialization error: ${err.message || 'Please check your internet connection and try again.'}`);
          setIsLoading(false);
        }
      } else {
        // For COD and Bank Transfer, create order directly
        const result = await orderAPI.createOrder(orderData);
        if (result.success) {
          setSuccess(true);
          setTimeout(() => {
            onOrderSuccess?.();
            onClose();
          }, 1500);
        } else {
          setError(result.error || 'Order creation failed. Please try again.');
          setIsLoading(false);
        }
      }
    } catch (err) {
      setError(err.message || 'Failed to process order. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#d6ebe4] bg-white rounded-t-2xl">
          <h2 className="text-2xl font-semibold text-[#1f3d3a]">Purchase Medicine</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="text-[#6b8781] hover:text-[#1f3d3a] transition-colors disabled:opacity-50"
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
                <p className="text-[#6b8781]">Price/Unit</p>
                <p className="font-medium text-[#1f3d3a]">₹ {medicine.price}</p>
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
            <div className="mb-4 p-3 rounded-lg bg-green-50 border border-green-200 flex gap-2">
              <Check size={20} className="text-green-600 flex-shrink-0" />
              <p className="text-sm text-green-700 font-medium">Order placed successfully!</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleRazorpayPayment} className="space-y-4">
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
                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] disabled:bg-gray-100"
              />
              <p className="text-xs text-[#6b8781] mt-1">Max: {medicine.qty} units</p>
            </div>

            {/* Total Price */}
            <div className="p-4 rounded-lg bg-[#f0f8f5] border border-[#d6ebe4]">
              <p className="text-sm text-[#6b8781] mb-1">Total Amount</p>
              <p className="text-3xl font-bold text-[#1f3d3a]">₹ {totalPrice}</p>
              <p className="text-xs text-[#6b8781] mt-2">{quantity} × ₹{medicine.price}</p>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Payment Method <span className="text-red-600">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] disabled:bg-gray-100"
              >
                <option value="card">Credit/Debit Card</option>
                <option value="upi">UPI</option>
                <option value="cod">Cash on Delivery</option>
                <option value="bank">Bank Transfer</option>
              </select>
              {(paymentMethod === 'card' || paymentMethod === 'upi') && (
                <p className="text-xs text-[#6b8781] mt-1">💳 Secure payment via Razorpay</p>
              )}
            </div>

            {/* Shipping Address */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Shipping Address <span className="text-red-600">*</span>
              </label>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                placeholder="Enter complete shipping address (Street, City, State, ZIP)..."
                rows={3}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] resize-none disabled:bg-gray-100"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-sm font-medium text-[#1f3d3a] mb-2">
                Special Instructions
              </label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any special requests? (e.g., 'Deliver before 2 PM') - Optional"
                rows={2}
                disabled={isLoading}
                className="w-full px-4 py-2 rounded-lg border border-[#d3e7e0] focus:outline-none focus:ring-2 focus:ring-[#37aa82] resize-none disabled:bg-gray-100"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4 border-t border-[#d6ebe4]">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading || success}
                className="flex-1 px-4 py-2.5 rounded-xl border border-[#d3e7e0] text-[#3d5f57] font-medium hover:bg-[#ecf7f3] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || success}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#37aa82] to-[#2e9d79] text-white font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Processing...
                  </>
                ) : success ? (
                  <>
                    <Check size={18} />
                    Order Placed
                  </>
                ) : (
                  `Pay ₹ ${totalPrice}`
                )}
              </button>
            </div>

            {/* Payment Info */}
            <div className="text-xs text-[#6b8781] text-center mt-4 p-3 bg-[#f0f8f5] rounded-lg">
              ✓ Secure payment processing | ✓ Instant confirmation
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
