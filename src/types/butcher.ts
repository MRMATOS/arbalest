// Butcher Module Types

export interface ButcherOrderItem {
    product_id: string;
    product_code: string;
    product_name: string;
    product_ean?: string;
    quantity: number;
    original_quantity?: number;
    unit: 'bandeja' | 'kg';
    notes?: string;
}

export interface ButcherOrder {
    id: string;
    order_number: string;
    requester_store_id: string;
    production_store_id?: string;
    status: 'draft' | 'pending' | 'printed' | 'completed';
    submitted_at?: string;
    printed_at?: string;
    completed_at?: string;
    created_at: string;
    created_by?: string;
    items: ButcherOrderItem[];
    // Joined data (populated by hook)
    requester_store?: {
        id: string;
        name: string;
        code?: string;
    };
}

export type ButcherOrderStatus = ButcherOrder['status'];

// Status labels in Portuguese
export const ORDER_STATUS_LABELS: Record<ButcherOrderStatus, string> = {
    draft: 'Rascunho',
    pending: 'Pendente',
    printed: 'Produzindo',
    completed: 'Concluído'
};

// Status badge colors
export const ORDER_STATUS_BADGE: Record<ButcherOrderStatus, string> = {
    draft: 'arbalest-badge-neutral',
    pending: 'arbalest-badge-warning',
    printed: 'arbalest-badge-info',
    completed: 'arbalest-badge-success'
};
