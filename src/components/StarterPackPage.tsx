import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { SubscriptionService } from '../services/subscriptionService';
import { StarterPackService, StarterPackOrder } from '../services/starterPackService';
import { Package, Tablet, CheckCircle, Clock, AlertCircle, Truck, Wrench } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export default function StarterPackPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasAccess, setHasAccess] = useState(false);
  const [includesTablet, setIncludesTablet] = useState(false);
  const [orders, setOrders] = useState<StarterPackOrder[]>([]);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAccess();
    loadOrders();
  }, [user]);

  const checkAccess = async () => {
    if (!user) return;

    try {
      const accessData = await SubscriptionService.checkSubscriptionAccess(user.id);
      const isPaidPlan = accessData.subscription?.plan_type !== 'trial' && accessData.hasAccess;
      setHasAccess(isPaidPlan);
    } catch (error) {
      console.error('Error checking access:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOrders = async () => {
    if (!user) return;

    try {
      const userOrders = await StarterPackService.getUserOrders(user.id);
      setOrders(userOrders);
    } catch (error) {
      console.error('Error loading orders:', error);
    }
  };

  const handleOrderSubmit = async () => {
    if (!user) return;

    setProcessing(true);
    setError(null);

    try {
      const totalCost = StarterPackService.calculateTotalCost(includesTablet);

      if (totalCost === 0) {
        const order = await StarterPackService.createOrder(user.id, includesTablet);
        await StarterPackService.updateOrderPaymentStatus(order.id, 'free-order', 'completed');
        await loadOrders();
        setIncludesTablet(false);
        return;
      }

      const order = await StarterPackService.createOrder(user.id, includesTablet);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify({
            userId: user.id,
            amount: totalCost,
            metadata: {
              orderId: order.id,
              orderType: 'starter_pack',
              includesTablet: includesTablet
            }
          })
        }
      );

      const { clientSecret } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error('Stripe failed to load');
      }

      const { error: stripeError } = await stripe.confirmCardPayment(clientSecret);

      if (stripeError) {
        await StarterPackService.updateOrderPaymentStatus(order.id, clientSecret, 'failed');
        throw new Error(stripeError.message);
      }

      await StarterPackService.updateOrderPaymentStatus(order.id, clientSecret, 'completed');
      await loadOrders();
      setIncludesTablet(false);
    } catch (err: any) {
      console.error('Error processing order:', err);
      setError(err.message || 'Failed to process order');
    } finally {
      setProcessing(false);
    }
  };

  const totalCost = StarterPackService.calculateTotalCost(includesTablet);
  const activeOrder = orders.find(order =>
    order.payment_status === 'completed' &&
    order.order_status !== 'delivered'
  );

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

  return (
    <div className="max-w-6xl mx-auto space-y-8">
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
          <OrderTracking order={activeOrder} />
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
                onClick={handleOrderSubmit}
                disabled={processing}
                className="w-full bg-gradient-to-r from-[#E6A85C] to-[#E85A9B] text-white font-semibold py-4 rounded-xl hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : totalCost === 0 ? 'Place Order' : `Pay ${totalCost} AED`}
              </button>
            </div>
          </div>
        )}
      </div>

      {orders.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Order History</h2>
          <div className="space-y-4">
            {orders.map((order) => (
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
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    order.order_status === 'delivered'
                      ? 'bg-green-100 text-green-800'
                      : order.order_status === 'out_for_delivery'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {StarterPackService.getStatusLabel(order.order_status)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderTracking({ order }: { order: StarterPackOrder }) {
  const stages = [
    { key: 'received', label: 'Order Received', icon: CheckCircle },
    { key: 'preparing', label: 'Preparing', icon: Package },
    { key: 'configuring', label: 'Configuring', icon: Wrench },
    { key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck },
    { key: 'delivered', label: 'Delivered', icon: CheckCircle }
  ];

  const currentIndex = StarterPackService.getStatusIndex(order.order_status);

  return (
    <div className="space-y-8">
      <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-2">Tracking Your Order</h3>
        <p className="text-gray-700 mb-4">Order #{order.id.slice(0, 8)}</p>
        {order.estimated_delivery && (
          <div className="flex items-center gap-2 text-sm text-gray-700">
            <Clock className="w-4 h-4" />
            <span>
              Estimated delivery: {new Date(order.estimated_delivery).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
        )}
      </div>

      <div className="relative">
        {stages.map((stage, index) => {
          const Icon = stage.icon;
          const isActive = index <= currentIndex;
          const isCurrent = index === currentIndex;

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
                  isActive
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                <Icon className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p
                  className={`font-semibold ${
                    isActive ? 'text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {stage.label}
                </p>
                {isCurrent && (
                  <p className="text-sm text-blue-600 font-medium">In Progress</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
