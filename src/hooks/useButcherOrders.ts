import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { ButcherOrder, ButcherOrderItem } from '../types/butcher';

interface UseButcherOrdersOptions {
    statusFilter?: 'draft' | 'pending' | 'printed' | 'completed' | 'all' | string[]; // Allow array
    historyOnly?: boolean; // Only completed orders
}

export const useButcherOrders = (options: UseButcherOrdersOptions = {}) => {
    const [orders, setOrders] = useState<ButcherOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();

    // Create stable key for filter dependency to avoid infinite loops with arrays
    const filterKey = Array.isArray(options.statusFilter)
        ? options.statusFilter.sort().join(',')
        : options.statusFilter;

    const fetchOrders = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            let query = supabase
                .schema('butcher')
                .from('orders')
                .select('*');

            // Apply status filter
            if (options.historyOnly) {
                query = query.eq('status', 'completed');
            } else if (options.statusFilter && options.statusFilter !== 'all') {
                if (Array.isArray(options.statusFilter)) {
                    query = query.in('status', options.statusFilter);
                } else {
                    query = query.eq('status', options.statusFilter);
                }
            }

            const { data: ordersData, error: ordersError } = await query
                .order('created_at', { ascending: false });

            if (ordersError) throw ordersError;

            // Fetch store names for display
            const storeIds = [...new Set((ordersData || []).map(o => o.requester_store_id))];

            const { data: storesData } = await supabase
                .from('stores')
                .select('id, name, code')
                .in('id', storeIds);

            const storesMap = new Map(storesData?.map(s => [s.id, s]) || []);

            // Hydrate orders with store data
            const hydratedOrders: ButcherOrder[] = (ordersData || []).map(order => ({
                ...order,
                items: order.items || [],
                requester_store: storesMap.get(order.requester_store_id)
            }));

            setOrders(hydratedOrders);
        } catch (err) {
            console.error('❌ Error fetching orders:', err);
            setError(err instanceof Error ? err.message : 'Erro ao buscar pedidos');
        } finally {
            setLoading(false);
        }
    }, [filterKey, options.historyOnly]);

    useEffect(() => {
        fetchOrders();
    }, [fetchOrders]);

    // Get single order by ID
    const getOrder = async (id: string): Promise<ButcherOrder | null> => {
        try {
            const { data, error } = await supabase
                .schema('butcher')
                .from('orders')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch store data
            const { data: store } = await supabase
                .from('stores')
                .select('id, name, code')
                .eq('id', data.requester_store_id)
                .single();

            return {
                ...data,
                items: data.items || [],
                requester_store: store || undefined
            };
        } catch (err) {
            console.error('❌ Error fetching order:', err);
            return null;
        }
    };

    // Generate order number: loja-DDMM-seq
    const generateOrderNumber = async (storeId: string): Promise<string> => {
        // Get store info
        const { data: store } = await supabase
            .from('stores')
            .select('name, code')
            .eq('id', storeId)
            .single();

        const prefix = (store?.code || store?.name?.split(' ')[0] || 'loja').toLowerCase();
        const now = new Date();
        const day = String(now.getDate()).padStart(2, '0');
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const dateKey = `${day}${month}`;

        // Count orders from this store today
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const { count } = await supabase
            .schema('butcher')
            .from('orders')
            .select('*', { count: 'exact', head: true })
            .eq('requester_store_id', storeId)
            .gte('created_at', startOfDay);

        const seq = String((count || 0) + 1).padStart(2, '0');
        return `${prefix}-${dateKey}-${seq}`;
    };

    // Create new order
    const createOrder = async (storeId: string, items: ButcherOrderItem[] = []): Promise<ButcherOrder | null> => {
        try {
            const orderNumber = await generateOrderNumber(storeId);

            const { data, error } = await supabase
                .schema('butcher')
                .from('orders')
                .insert({
                    order_number: orderNumber,
                    requester_store_id: storeId,
                    created_by: user?.id,
                    items: items,
                    status: 'draft'
                })
                .select()
                .single();

            if (error) throw error;

            console.log('✅ Order created:', data.order_number);
            await fetchOrders();
            return data;
        } catch (err) {
            console.error('❌ Error creating order:', err);
            throw err;
        }
    };

    // Update order items
    const updateOrderItems = async (orderId: string, items: ButcherOrderItem[]): Promise<boolean> => {
        try {
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .update({ items })
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items } : o));
            return true;
        } catch (err) {
            console.error('❌ Error updating items:', err);
            return false;
        }
    };

    // Update order status
    const updateOrderStatus = async (
        orderId: string,
        status: ButcherOrder['status']
    ): Promise<boolean> => {
        try {
            const updates: Record<string, unknown> = { status };

            // Set timestamps based on status
            if (status === 'pending') {
                updates.submitted_at = new Date().toISOString();
            } else if (status === 'printed') {
                updates.printed_at = new Date().toISOString();
            } else if (status === 'completed') {
                updates.completed_at = new Date().toISOString();
            }

            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .update(updates)
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status, ...updates } : o
            ));
            return true;
        } catch (err) {
            console.error('❌ Error updating status:', err);
            return false;
        }
    };

    // Delete order
    const deleteOrder = async (orderId: string): Promise<boolean> => {
        try {
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .delete()
                .eq('id', orderId);

            if (error) throw error;

            setOrders(prev => prev.filter(o => o.id !== orderId));
            return true;
        } catch (err) {
            console.error('❌ Error deleting order:', err);
            return false;
        }
    };

    // Copy order from history
    const copyOrder = async (sourceOrderId: string): Promise<ButcherOrder | null> => {
        try {
            const sourceOrder = await getOrder(sourceOrderId);
            if (!sourceOrder) throw new Error('Pedido não encontrado');

            // Create new order with same items, preserving quantity
            const newItems = sourceOrder.items.map(item => ({
                ...item,
                original_quantity: item.quantity,
                quantity: item.quantity // Keep the original quantity
            }));

            const newOrder = await createOrder(sourceOrder.requester_store_id, newItems);
            return newOrder;
        } catch (err) {
            console.error('❌ Error copying order:', err);
            return null;
        }
    };

    // Cleanup empty draft orders
    const cleanupEmptyDrafts = useCallback(async (): Promise<void> => {
        try {
            if (!user?.id) return;

            console.log('🧹 Cleaning up empty drafts...');

            // Delete drafts that have no items (or empty array)
            const { error } = await supabase
                .schema('butcher')
                .from('orders')
                .delete()
                .eq('status', 'draft')
                .eq('created_by', user.id)
                .or('items.is.null,items.eq.[]'); // Check for null or empty JSON array

            if (error) throw error;

            console.log('✅ Empty drafts cleaned up');
        } catch (err) {
            console.error('❌ Error cleaning up drafts:', err);
        }
    }, [user?.id]);

    return {
        orders,
        loading,
        error,
        refresh: fetchOrders,
        getOrder,
        createOrder,
        updateOrderItems,
        updateOrderStatus,
        deleteOrder,
        copyOrder,
        cleanupEmptyDrafts
    };
};
