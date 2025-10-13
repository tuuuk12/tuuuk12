import React, { useState, useEffect } from 'react';
import { StarterPackService, StarterPackOrder } from '../services/starterPackService';
import { Package, ChevronRight, Upload, Check, Clock, MapPin, Phone, Tablet } from 'lucide-react';

export default function StarterPackOrdersAdmin() {
  const [orders, setOrders] = useState<StarterPackOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<StarterPackOrder | null>(null);
  const [proofOfDeliveryUrl, setProofOfDeliveryUrl] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      const allOrders = await StarterPackService.getAllOrders();
      setOrders(allOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    setUpdating(true);
    try {
      await StarterPackService.updateOrderStatus(orderId, newStatus as any);
      await loadOrders();
      if (selectedOrder && selectedOrder.id === orderId) {
        const updated = await StarterPackService.getOrderById(orderId);
        setSelectedOrder(updated);
      }
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update order status');
    } finally {
      setUpdating(false);
    }
  };

  const handleProofUpload = async () => {
    if (!selectedOrder || !proofOfDeliveryUrl.trim()) {
      alert('Please enter a proof of delivery URL');
      return;
    }

    setUpdating(true);
    try {
      await StarterPackService.updateProofOfDelivery(selectedOrder.id, proofOfDeliveryUrl);
      await loadOrders();
      const updated = await StarterPackService.getOrderById(selectedOrder.id);
      setSelectedOrder(updated);
      setProofOfDeliveryUrl('');
      alert('Proof of delivery uploaded successfully');
    } catch (error) {
      console.error('Error uploading proof:', error);
      alert('Failed to upload proof of delivery');
    } finally {
      setUpdating(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'out_for_delivery':
        return 'bg-blue-100 text-blue-800';
      case 'configuring':
      case 'preparing':
        return 'bg-yellow-100 text-yellow-800';
      case 'received':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const statuses = [
    { value: 'received', label: 'Order Received' },
    { value: 'preparing', label: 'Preparing' },
    { value: 'configuring', label: 'Configuring' },
    { value: 'out_for_delivery', label: 'Out for Delivery' },
    { value: 'delivered', label: 'Delivered' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-4">
        <div className="w-12 h-12 bg-gradient-to-br from-[#E6A85C] to-[#E85A9B] rounded-xl flex items-center justify-center">
          <Package className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Starter Pack Orders</h1>
          <p className="text-gray-600">Manage and track all starter pack orders</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="font-semibold text-gray-900">Orders List</h2>
            <p className="text-sm text-gray-600">{orders.length} total orders</p>
          </div>
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {orders.map((order) => (
              <button
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                  selectedOrder?.id === order.id ? 'bg-blue-50' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">
                      Order #{order.id.slice(0, 8)}
                    </p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                      order.order_status
                    )}`}
                  >
                    {StarterPackService.getStatusLabel(order.order_status)}
                  </span>
                  {order.includes_tablet && (
                    <span className="flex items-center gap-1 text-xs text-gray-600">
                      <Tablet className="w-3 h-3" />
                      Tablet
                    </span>
                  )}
                </div>
              </button>
            ))}
            {orders.length === 0 && (
              <div className="p-8 text-center text-gray-500">
                No orders found
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
          {selectedOrder ? (
            <div className="h-full flex flex-col">
              <div className="p-4 border-b border-gray-200 bg-gray-50">
                <h2 className="font-semibold text-gray-900">
                  Order Details
                </h2>
              </div>
              <div className="flex-1 p-6 space-y-6 overflow-y-auto max-h-[600px]">
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Order Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID:</span>
                      <span className="font-medium text-gray-900">
                        {selectedOrder.id.slice(0, 8)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Cost:</span>
                      <span className="font-medium text-gray-900">
                        {selectedOrder.total_cost} AED
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Includes Tablet:</span>
                      <span className="font-medium text-gray-900">
                        {selectedOrder.includes_tablet ? 'Yes' : 'No'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order Date:</span>
                      <span className="font-medium text-gray-900">
                        {new Date(selectedOrder.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                    {selectedOrder.estimated_delivery && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Est. Delivery:
                        </span>
                        <span className="font-medium text-gray-900">
                          {new Date(selectedOrder.estimated_delivery).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {selectedOrder.delivery_address_line1 && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      Delivery Address
                    </h3>
                    <div className="text-sm text-gray-700 space-y-1 bg-gray-50 rounded-lg p-3">
                      <p>{selectedOrder.delivery_address_line1}</p>
                      {selectedOrder.delivery_address_line2 && (
                        <p>{selectedOrder.delivery_address_line2}</p>
                      )}
                      <p>{selectedOrder.delivery_city}, {selectedOrder.delivery_emirate}</p>
                      {selectedOrder.delivery_contact_number && (
                        <p className="flex items-center gap-2 mt-2">
                          <Phone className="w-3 h-3" />
                          {selectedOrder.delivery_contact_number}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Update Status</h3>
                  <div className="space-y-2">
                    {statuses.map((status) => {
                      const currentIndex = StarterPackService.getStatusIndex(selectedOrder.order_status);
                      const statusIndex = StarterPackService.getStatusIndex(status.value);
                      const isCompleted = statusIndex < currentIndex;
                      const isCurrent = status.value === selectedOrder.order_status;
                      const isNext = statusIndex === currentIndex + 1;
                      const canUpdate = isNext || isCurrent;

                      return (
                        <button
                          key={status.value}
                          onClick={() => handleStatusUpdate(selectedOrder.id, status.value)}
                          disabled={updating || (!canUpdate && !isCompleted)}
                          className={`w-full p-3 rounded-lg border-2 text-left transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                            isCurrent
                              ? 'border-blue-500 bg-blue-50'
                              : isCompleted
                              ? 'border-green-500 bg-green-50'
                              : canUpdate
                              ? 'border-gray-300 hover:border-blue-300'
                              : 'border-gray-200 bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span
                              className={`font-medium ${
                                isCurrent
                                  ? 'text-blue-700'
                                  : isCompleted
                                  ? 'text-green-700'
                                  : 'text-gray-700'
                              }`}
                            >
                              {status.label}
                            </span>
                            {isCompleted && <Check className="w-5 h-5 text-green-600" />}
                            {isCurrent && (
                              <span className="text-xs text-blue-600 font-medium">Current</span>
                            )}
                          </div>
                          {selectedOrder.status_timestamps?.[status.value] && (
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(selectedOrder.status_timestamps[status.value]).toLocaleString('en-US', {
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </p>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedOrder.order_status === 'delivered' && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-3 flex items-center gap-2">
                      <Upload className="w-4 h-4" />
                      Proof of Delivery
                    </h3>
                    {selectedOrder.proof_of_delivery_url ? (
                      <div className="space-y-3">
                        <img
                          src={selectedOrder.proof_of_delivery_url}
                          alt="Proof of delivery"
                          className="w-full rounded-lg border border-gray-200"
                        />
                        <p className="text-xs text-gray-600">Proof uploaded</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <input
                          type="url"
                          value={proofOfDeliveryUrl}
                          onChange={(e) => setProofOfDeliveryUrl(e.target.value)}
                          placeholder="Enter image URL"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                        />
                        <button
                          onClick={handleProofUpload}
                          disabled={updating || !proofOfDeliveryUrl.trim()}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                        >
                          {updating ? 'Uploading...' : 'Upload Proof'}
                        </button>
                        <p className="text-xs text-gray-500">
                          Upload an image showing the delivered package
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full p-12 text-center">
              <div>
                <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">Select an order to view details</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
