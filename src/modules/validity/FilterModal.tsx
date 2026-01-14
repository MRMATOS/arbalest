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
            <div className="arbalest-form">
                <div className="arbalest-form-group">
                    <label className="arbalest-label">Loja</label>
                    <select
                        value={filters.store}
                        onChange={(e) => setFilters({ ...filters, store: e.target.value })}
                        className="arbalest-select"
                    >
                        <option value="all">Todas as Lojas</option>
                        {availableStores.map(store => (
                            <option key={store.id} value={store.id}>{store.name}</option>
                        ))}
                    </select>
                </div>

                <div className="arbalest-form-group">
                    <label className="arbalest-label">Encarregado</label>
                    <select
                        value={filters.user}
                        onChange={(e) => setFilters({ ...filters, user: e.target.value })}
                        className="arbalest-select"
                    >
                        <option value="all">Todos os Encarregados</option>
                        {availableUsers.map(u => (
                            <option key={u.id} value={u.id}>
                                {u.name || u.email}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="arbalest-form-group">
                    <label className="arbalest-label">Tipo</label>
                    <select
                        value={filters.type}
                        onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                        className="arbalest-select"
                    >
                        <option value="all">Todos os Tipos</option>
                        <option value="mercado">Mercado</option>
                        <option value="farmacia">Farmácia</option>
                    </select>
                </div>

                <div className="arbalest-form-group">
                    <label className="arbalest-label">Ordenar</label>
                    <select
                        value={filters.sortBy}
                        onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                        className="arbalest-select"
                    >
                        <option value="recent">Últimos Registrados</option>
                        <option value="expires_soon">Vence Mais Cedo</option>
                        <option value="expires_late">Vence Mais Tarde</option>
                    </select>
                </div>
            </div>

            <div className="arbalest-modal-actions">
                <button
                    onClick={onClose}
                    className="arbalest-btn arbalest-btn-neutral"
                >
                    Cancelar
                </button>
                <button
                    onClick={handleApply}
                    className="arbalest-btn arbalest-btn-primary"
                >
                    Filtrar
                </button>
            </div>
        </Modal>
    );
};
