import { useEffect, useState } from 'react';
import { ArrowLeft, Package, Clock, CheckCircle, XCircle, Truck } from 'lucide-react';
import { orderAPI } from '../services/api.js';

const statusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending' },
  confirmed: { icon: CheckCircle, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Confirmed' },
  shipped: { icon: Truck, color: 'text-blue-600', bg: 'bg-blue-50', label: 'Shipped' },
  delivered: { icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50', label: 'Delivered' },
  cancelled: { icon: XCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Cancelled' },
};

export default function OrderHistory() {
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      setError('');
      const response = await orderAPI.getMyOrders();
      if (response.success) {
        setOrders(response.orders);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch orders');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;

    try {
      const response = await orderAPI.cancelOrder(orderId);
      if (response.success) {
        setOrders(orders.map(o => o._id === orderId ? response.order : o));
        setSelectedOrder(null);
      }
    } catch (err) {
      alert(err.message || 'Failed to cancel order');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <main className="min-h-screen bg-[url('/sell-page-bg.png')] bg-cover bg-center px-4 pb-14 pt-4 md:px-8">
      <section className="mx-auto max-w-6xl rounded-[30px] border border-[#c9e2dc] bg-[#eaf8f4]/90 p-6 shadow-[0_22px_44px_rgba(37,84,73,0.12)] md:p-8">
        {/* Header */}
        <div className="grid gap-5 rounded-3xl border border-[#d6ebe4] bg-white/70 p-5 md:grid-cols-[auto_1fr] md:items-center mb-8">
          <button
            onClick={() => window.history.back()}
            className="text-[#3d5f57] hover:text-[#1f3d3a] transition-colors md:hidden"
          >
            <ArrowLeft size={24} />
          </button>
          <div className="md:col-span-2">
            <h1 className="text-2xl font-semibold text-[#1f3d3a] md:text-3xl">My Orders</h1>
            <p className="mt-2 text-sm text-[#5b7570] md:text-base">
              Track and manage your medicine purchases
            </p>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#37aa82]"></div>
            <p className="mt-4 text-[#5b7570]">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="p-4 rounded-xl bg-red-50 border border-red-200 mb-6">
            <p className="text-red-700">{error}</p>
            <button
              onClick={fetchOrders}
              className="mt-3 px-4 py-2 rounded-lg bg-red-100 text-red-700 hover:bg-red-200 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && orders.length === 0 && !error && (
          <div className="text-center py-12">
            <Package size={48} className="mx-auto text-[#c9e2dc] mb-4" />
            <h3 className="text-xl font-semibold text-[#1f3d3a]">No Orders Yet</h3>
            <p className="mt-2 text-[#5b7570]">
              You haven't placed any orders yet. Start shopping now!
            </p>
          </div>
        )}

        {/* Orders List */}
        {!isLoading && orders.length > 0 && (
          <div className="space-y-4">
            {orders.map((order) => {
              const statusInfo = statusConfig[order.status];
              const StatusIcon = statusInfo.icon;

              return (
                <div
                  key={order._id}
                  className="p-4 rounded-xl border border-[#d6ebe4] bg-white hover:bg-[#f8fcfb] transition-colors cursor-pointer"
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-start justify-between gap-4 md:items-center">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-[#223f3a] text-lg">
                          {order.medicineName}
                        </h3>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${statusInfo.bg} ${statusInfo.color}`}>
                          <StatusIcon size={14} />
                          {statusInfo.label}
                        </span>
                      </div>
                      <p className="text-sm text-[#6b8781]">
                        Order ID: {order._id}
                      </p>
                      <p className="text-sm text-[#6b8781] mt-1">
                        {formatDate(order.createdAt)}
                      </p>
                    </div>

                    <div className="text-right">
                      <p className="text-2xl font-bold text-[#1f3d3a]">
                        Rs {order.totalPrice}
                      </p>
                      <p className="text-sm text-[#6b8781]">
                        Qty: {order.quantity}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-6 border-b border-[#d6ebe4] bg-white rounded-t-2xl">
              <h2 className="text-xl font-semibold text-[#1f3d3a]">Order Details</h2>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-[#6b8781] hover:text-[#1f3d3a]"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-4">
              {/* Status */}
              <div className="p-4 rounded-xl bg-[#f0f8f5] border border-[#d6ebe4]">
                <p className="text-sm text-[#6b8781] mb-2">Status</p>
                <div className="flex items-center gap-2">
                  {(() => {
                    const statusInfo = statusConfig[selectedOrder.status];
                    const StatusIcon = statusInfo.icon;
                    return (
                      <>
                        <StatusIcon size={20} className={statusInfo.color} />
                        <span className="font-semibold text-[#1f3d3a]">
                          {statusInfo.label}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </div>

              {/* Medicine Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#223f3a]">Medicine Details</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-[#6b8781]">Medicine</span>
                    <span className="font-medium text-[#1f3d3a]">{selectedOrder.medicineName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b8781]">Type</span>
                    <span className="font-medium text-[#1f3d3a]">{selectedOrder.medicineType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b8781]">Quantity</span>
                    <span className="font-medium text-[#1f3d3a]">{selectedOrder.quantity} unit(s)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b8781]">Price per Unit</span>
                    <span className="font-medium text-[#1f3d3a]">Rs {selectedOrder.pricePerUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[#6b8781]">Expiry Date</span>
                    <span className="font-medium text-[#1f3d3a]">{selectedOrder.expiryDate}</span>
                  </div>
                </div>
              </div>

              {/* Order Summary */}
              <div className="p-3 rounded-lg bg-[#f0f8f5] border border-[#d6ebe4]">
                <p className="text-sm text-[#6b8781]">Total Amount</p>
                <p className="text-2xl font-bold text-[#1f3d3a]">Rs {selectedOrder.totalPrice}</p>
              </div>

              {/* Delivery Details */}
              <div className="space-y-3">
                <h3 className="font-semibold text-[#223f3a]">Delivery Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <p className="text-[#6b8781] mb-1">Shipping Address</p>
                    <p className="font-medium text-[#1f3d3a]">{selectedOrder.shippingAddress}</p>
                  </div>
                  <div>
                    <p className="text-[#6b8781] mb-1">Payment Method</p>
                    <p className="font-medium text-[#1f3d3a] capitalize">{selectedOrder.paymentMethod}</p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedOrder.notes && (
                <div className="space-y-3">
                  <h3 className="font-semibold text-[#223f3a]">Notes</h3>
                  <p className="text-sm text-[#1f3d3a] bg-[#f0f8f5] p-3 rounded-lg">
                    {selectedOrder.notes}
                  </p>
                </div>
              )}

              {/* Dates */}
              <div className="text-xs text-[#6b8781] space-y-1 pt-3 border-t border-[#d6ebe4]">
                <p>Ordered: {formatDate(selectedOrder.createdAt)}</p>
                <p>Last Updated: {formatDate(selectedOrder.updatedAt)}</p>
              </div>

              {/* Cancel Button */}
              {selectedOrder.status === 'pending' && (
                <button
                  onClick={() => handleCancelOrder(selectedOrder._id)}
                  className="w-full mt-4 px-4 py-2.5 rounded-xl border border-red-300 text-red-600 font-medium hover:bg-red-50 transition-colors"
                >
                  Cancel Order
                </button>
              )}

              {/* Close Button */}
              <button
                onClick={() => setSelectedOrder(null)}
                className="w-full px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#37aa82] to-[#2e9d79] text-white font-medium hover:opacity-90 transition-opacity"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
