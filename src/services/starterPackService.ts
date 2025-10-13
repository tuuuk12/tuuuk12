import { supabase } from '../lib/supabase';

export interface DeliveryAddress {
  addressLine1: string;
  addressLine2: string;
  city: string;
  emirate: string;
  contactNumber: string;
}

export interface StarterPackOrder {
  id: string;
  user_id: string;
  restaurant_id?: string;
  order_status: 'pending' | 'received' | 'preparing' | 'configuring' | 'out_for_delivery' | 'delivered';
  includes_tablet: boolean;
  tablet_cost: number;
  total_cost: number;
  payment_status: 'pending' | 'completed' | 'failed';
  stripe_payment_intent_id?: string;
  estimated_delivery?: string;
  delivered_at?: string;
  delivery_address_line1?: string;
  delivery_address_line2?: string;
  delivery_city?: string;
  delivery_emirate?: string;
  delivery_contact_number?: string;
  proof_of_delivery_url?: string;
  status_timestamps?: Record<string, string>;
  created_at: string;
  updated_at: string;
}

export class StarterPackService {
  private static readonly STARTER_PACK_BASE_COST = 0;
  private static readonly TABLET_COST = 499;

  static async createOrder(
    userId: string,
    includesTablet: boolean,
    deliveryAddress: DeliveryAddress,
    restaurantId?: string
  ): Promise<StarterPackOrder> {
    try {
      const tabletCost = includesTablet ? this.TABLET_COST : 0;
      const totalCost = this.STARTER_PACK_BASE_COST + tabletCost;

      const { data, error } = await supabase
        .from('starter_pack_orders')
        .insert({
          user_id: userId,
          restaurant_id: restaurantId || null,
          includes_tablet: includesTablet,
          tablet_cost: tabletCost,
          total_cost: totalCost,
          order_status: 'received',
          payment_status: 'completed',
          delivery_address_line1: deliveryAddress.addressLine1,
          delivery_address_line2: deliveryAddress.addressLine2,
          delivery_city: deliveryAddress.city,
          delivery_emirate: deliveryAddress.emirate,
          delivery_contact_number: deliveryAddress.contactNumber,
          status_timestamps: JSON.stringify({ received: new Date().toISOString() })
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error creating starter pack order:', error);
      throw error;
    }
  }

  static async updateOrderPaymentStatus(
    orderId: string,
    paymentIntentId: string,
    status: 'completed' | 'failed'
  ): Promise<void> {
    try {
      const updateData: any = {
        payment_status: status,
        stripe_payment_intent_id: paymentIntentId
      };

      if (status === 'completed') {
        updateData.order_status = 'received';
      }

      const { error } = await supabase
        .from('starter_pack_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating order payment status:', error);
      throw error;
    }
  }

  static async getUserOrders(userId: string): Promise<StarterPackOrder[]> {
    try {
      const { data, error } = await supabase
        .from('starter_pack_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('payment_status', 'completed')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching user orders:', error);
      throw error;
    }
  }

  static async getOrderById(orderId: string): Promise<StarterPackOrder | null> {
    try {
      const { data, error } = await supabase
        .from('starter_pack_orders')
        .select('*')
        .eq('id', orderId)
        .maybeSingle();

      if (error) throw error;
      return data;
    } catch (error: any) {
      console.error('Error fetching order:', error);
      return null;
    }
  }

  static async updateOrderStatus(
    orderId: string,
    status: 'pending' | 'received' | 'preparing' | 'configuring' | 'out_for_delivery' | 'delivered'
  ): Promise<void> {
    try {
      const updateData: any = { order_status: status };

      if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('starter_pack_orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating order status:', error);
      throw error;
    }
  }

  static async getAllOrders(): Promise<StarterPackOrder[]> {
    try {
      const { data, error } = await supabase
        .from('starter_pack_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('Error fetching all orders:', error);
      throw error;
    }
  }

  static calculateTotalCost(includesTablet: boolean): number {
    return this.STARTER_PACK_BASE_COST + (includesTablet ? this.TABLET_COST : 0);
  }

  static getTabletCost(): number {
    return this.TABLET_COST;
  }

  static getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: 'Pending',
      received: 'Order Received',
      preparing: 'Preparing',
      configuring: 'Configuring',
      out_for_delivery: 'Out for Delivery',
      delivered: 'Delivered'
    };
    return labels[status] || status;
  }

  static getStatusIndex(status: string): number {
    const statuses = ['pending', 'received', 'preparing', 'configuring', 'out_for_delivery', 'delivered'];
    return statuses.indexOf(status);
  }

  static async updateProofOfDelivery(
    orderId: string,
    proofUrl: string
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('starter_pack_orders')
        .update({ proof_of_delivery_url: proofUrl })
        .eq('id', orderId);

      if (error) throw error;
    } catch (error: any) {
      console.error('Error updating proof of delivery:', error);
      throw error;
    }
  }

  static calculateEstimatedDelivery(orderDate: string): Date {
    const orderTime = new Date(orderDate);
    return new Date(orderTime.getTime() + 9 * 60 * 60 * 1000);
  }

  static isDelayed(orderDate: string, currentStatus: string, estimatedDelivery: string): boolean {
    if (currentStatus === 'delivered' || currentStatus === 'out_for_delivery') {
      return false;
    }
    const now = new Date();
    const eta = new Date(estimatedDelivery);
    return now > eta;
  }

  static getDelayMessage(estimatedDelivery: string): string {
    const now = new Date();
    const eta = new Date(estimatedDelivery);
    const delayHours = Math.floor((now.getTime() - eta.getTime()) / (1000 * 60 * 60));

    if (delayHours < 1) {
      return 'Your order is slightly delayed. We apologize for the inconvenience.';
    } else if (delayHours < 3) {
      return `Your order is delayed by approximately ${delayHours} hour${delayHours > 1 ? 's' : ''}. Our team is working to get it to you as soon as possible.`;
    } else {
      return `We sincerely apologize for the delay. Your order is taking longer than expected. Please contact support for more information.`;
    }
  }
}
 