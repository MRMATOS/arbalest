import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/Modal';


interface FilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: FilterState) => void;
    currentFilters: FilterState;
    availableStores: Array<{ id: string, name: string }>;
    availableUsers: Array<{ id: string, name?: string, email?: string }>;
}

export interface FilterState {
    store: string;
    user: string;
    type: string;
    sortBy: string;
}

export const FilterModal: React.FC<FilterModalProps> = ({
    isOpen,
    onClose,
    onApply,
    currentFilters,
    availableStores,
    availableUsers
}) => {
    const [filters, setFilters] = useState<FilterState>(currentFilters);

    // Reset local state when modal opens
    useEffect(() => {
        if (isOpen) {
            setFilters(currentFilters);
        }
    }, [isOpen, currentFilters]);

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Filtrar Produtos"
        >
            <div className="modal-body-filters" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Loja</label>
                    <select
                        value={filters.store}
                        onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="all">Todas as Lojas</option>
                        {availableStores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Encarregado</label>
                    <select
                        value={filters.user}
                        onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="all">Todos os Encarregados</option>
                        {availableUsers.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Tipo</label>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="mercado">Mercado</option>
                        <option value="farmacia">Farmácia</option>
                    </select>
                </div>

                <div className="form-group">
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>Ordenar</label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--glass-border)' }}
                    >
                        <option value="recent">Últimos Registrados</option>
                        <option value="expires_soon">Vence Mais Cedo</option>
                        <option value="expires_late">Vence Mais Tarde</option>
                    </select>
                </div>
            </div>

            <div className="modal-footer" style={{ marginTop: '24px', display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                <button
                    onClick={onClose}
                    className="btn-secondary"
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}
                >
                    Cancelar
                </button>
                <button
                    onClick={handleApply}
                    className="btn-primary"
                    style={{ padding: '10px 20px', borderRadius: '8px', background: 'var(--brand-primary)', color: 'white', border: 'none', fontWeight: 600 }}
                >
                    Filtrar
                </button>
            </div>
        </Modal>
    );
};
