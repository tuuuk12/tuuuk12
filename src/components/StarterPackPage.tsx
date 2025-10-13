import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionService } from '../services/subscriptionService';
import { StarterPackService, StarterPackOrder, DeliveryAddress } from '../services/starterPackService';
import AddressCollectionModal from './AddressCollectionModal';
import {
  Package,
  Tablet,
  CheckCircle,
  Clock,
  AlertCircle,
  Truck,
  Wrench,
  MapPin,
  Phone,
  Building2,
  Image as ImageIcon
} from 'lucide-react';

export default function StarterPackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [includesTablet, setIncludesTablet] = useState(false);
  const [orders, setOrders] = useState<StarterPackOrder[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (user) {
      checkAccess();
      loadOrders();
    }
  }, [user]);

  const checkAccess = async () => {
    try {
      const accessData = await SubscriptionService.checkSubscriptionAccess(user!.id);
      const isPaidPlan = accessData.subscription?.plan_type !== 'trial' && accessData.hasAccess;
      setHasAccess(isPaidPlan);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    try {
      const userOrders = await StarterPackService.getUserOrders(user!.id);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handlePlaceOrder = () => {
    setShowAddressModal(true);
    setError(null);
  };

  const handleAddressSubmit = async (address: DeliveryAddress) => {
    setIsProcessing(true);
    setError(null);

    try {
      await StarterPackService.createOrder(user!.id, includesTablet, address);
      setShowAddressModal(false);
      await loadOrders();
      setIncludesTablet(false);
    } catch (err: any) {
      console.error('Error creating order:', err);
      setError(err.message || 'Failed to create order');
    } finally {
      setIsProcessing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!hasAccess) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-16 h-16 text-yellow-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paid Plan Required</h2>
          <p className="text-gray-600 mb-6">
            This feature is available for paid plans only. Upgrade your plan to order your Starter Pack.
          </p>
          <a
            href="/upgrade"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] text-white font-medium rounded-xl hover:shadow-lg transition-all"
          >
            Upgrade Now
          </a>
        </div>
      </div>
    );
  }

  const totalCost = StarterPackService.calculateTotalCost(includesTablet);
  const activeOrder = orders.find(
    (order) => order.payment_status === 'completed' && order.order_status !== 'delivered'
  );

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <AddressCollectionModal
        isOpen={showAddressModal}
        onClose={() => !isProcessing && setShowAddressModal(false)}
        onSubmit={handleAddressSubmit}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 bg-gradient-to-br from-[#E6A85C] to-[#E85A9B] rounded-xl flex items-center justify-center">
            <Package className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Starter Pack</h1>
            <p className="text-gray-600">Get your business started with our essential package</p>
          </div>
        </div>

        {activeOrder ? (
          <OrderTracking order={activeOrder} onUpdate={loadOrders} />
        ) : (
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">What's Included</h3>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">QR code stands or stickers for customer engagement</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Promotional materials and setup guide</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-gray-700">Quick start documentation</span>
                </li>
              </ul>
            </div>

            <div className="border-2 border-gray-200 rounded-xl p-6 hover:border-blue-300 transition-colors">
              <label className="flex items-start gap-4 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includesTablet}
                  onChange={(e) => setIncludesTablet(e.target.checked)}
                  className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Tablet className="w-6 h-6 text-gray-700" />
                    <span className="font-semibold text-gray-900">Add Tablet</span>
                    <span className="ml-auto text-lg font-bold text-gray-900">499 AED</span>
                  </div>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <p className="font-medium text-gray-900">Recommended: Samsung A9 or similar</p>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li>• 4GB RAM minimum</li>
                      <li>• Quad-core processor</li>
                      <li>• 10.1" display</li>
                      <li>• Android 11 or higher</li>
                    </ul>
                  </div>
                </div>
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
                <p className="text-red-800">{error}</p>
              </div>
            )}

            <div className="bg-gray-50 rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-lg font-medium text-gray-900">Total Cost</span>
                <span className="text-3xl font-bold text-gray-900">{totalCost} AED</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
                <Clock className="w-4 h-4" />
                <span>Estimated delivery: 9 hours from order time</span>
              </div>
              <button
                onClick={handlePlaceOrder}
                disabled={isProcessing}
                className="w-full bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isProcessing ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        )}
      </div>

      {orders.filter(o => o.order_status === 'delivered').length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
          <div className="space-y-4">
            {orders.filter(o => o.order_status === 'delivered').map((order) => (
              <div key={order.id} className="border border-gray-200 rounded-xl p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-sm text-gray-600">
                      {new Date(order.created_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-gray-900">{order.total_cost} AED</p>
                    <p className="text-sm text-gray-600">
                      {order.includes_tablet ? 'With Tablet' : 'Starter Pack Only'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                    Delivered
                  </span>
                  {order.delivered_at && (
                    <span className="text-sm text-gray-600">
                      on {new Date(order.delivered_at).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderTracking({ order, onUpdate }: { order: StarterPackOrder; onUpdate: () => void }) {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      onUpdate();
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  const stages = [
    { key: 'received', label: 'Order Received', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'configuring', label: 'Configuring', icon: Wrench },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentIndex = StarterPackService.getStatusIndex(order.order_status);
  const estimatedDelivery = order.estimated_delivery
    ? new Date(order.estimated_delivery)
    : StarterPackService.calculateEstimatedDelivery(order.created_at);

  const isDelayed = StarterPackService.isDelayed(
    order.created_at,
    order.order_status,
    estimatedDelivery.toISOString()
  );

  const deliveryAddress = order.delivery_address_line1 ? {
    line1: order.delivery_address_line1,
    line2: order.delivery_address_line2,
    city: order.delivery_city,
    emirate: order.delivery_emirate,
    phone: order.delivery_contact_number
  } : null;

  if (order.order_status === 'delivered') {
    return (
      <div className="space-y-6">
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-8 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-2">Order Delivered!</h3>
          <p className="text-gray-700 mb-4">Your Starter Pack has been successfully delivered</p>
          {order.delivered_at && (
            <p className="text-sm text-gray-600">
              Delivered on {new Date(order.delivered_at).toLocaleString('en-US', {
                month: 'long',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          )}
        </div>

        {order.proof_of_delivery_url && (
          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ImageIcon className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Proof of Delivery</h4>
            </div>
            <img
              src={order.proof_of_delivery_url}
              alt="Proof of delivery"
              className="w-full max-w-md rounded-lg border border-gray-200"
            />
          </div>
        )}

        {deliveryAddress && (
          <div className="bg-gray-50 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <MapPin className="w-5 h-5 text-gray-600" />
              <h4 className="font-semibold text-gray-900">Delivery Address</h4>
            </div>
            <div className="text-gray-700 space-y-1">
              <p>{deliveryAddress.line1}</p>
              {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
              <p>{deliveryAddress.city}, {deliveryAddress.emirate}</p>
              {deliveryAddress.phone && (
                <p className="flex items-center gap-2 mt-2">
                  <Phone className="w-4 h-4" />
                  {deliveryAddress.phone}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Your Order</h3>
        <p className="text-gray-700 mb-4">Order #{order.id.slice(0, 8)}</p>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            <span>
              Estimated delivery: {estimatedDelivery.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          {isDelayed && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-800">
                {StarterPackService.getDelayMessage(estimatedDelivery.toISOString())}
              </p>
            </div>
          )}
        </div>
      </div>

      {deliveryAddress && (
        <div className="bg-gray-50 rounded-xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <MapPin className="w-5 h-5 text-gray-600" />
            <h4 className="font-semibold text-gray-900">Delivery Address</h4>
          </div>
          <div className="text-gray-700 space-y-1">
            <p>{deliveryAddress.line1}</p>
            {deliveryAddress.line2 && <p>{deliveryAddress.line2}</p>}
            <p>{deliveryAddress.city}, {deliveryAddress.emirate}</p>
            {deliveryAddress.phone && (
              <p className="flex items-center gap-2 mt-2">
                <Phone className="w-4 h-4" />
                {deliveryAddress.phone}
              </p>
            )}
          </div>
        </div>
      )}

      <div className="relative">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;
          const statusTimestamp = order.status_timestamps?.[stage.key];

          return (
            <div key={stage.key} className="relative flex items-center gap-4 pb-8 last:pb-0">
              {index < stages.length - 1 && (
                <div
                  className={`absolute left-6 top-12 w-0.5 h-full ${
                    isActive ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                />
              )}
              <div
                className={`relative z-10 w-12 h-12 rounded-full flex items-center justify-center ${
                  isActive ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="text-sm text-blue-600 font-medium">In Progress</p>
                )}
                {statusTimestamp && (
                  <p className="text-xs text-gray-500">
                    {new Date(statusTimestamp).toLocaleString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
