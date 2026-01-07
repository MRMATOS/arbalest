import React from 'react';
import { X } from 'lucide-react';
import '../../../styles/global.css';

interface ButcherFilterModalProps {
    isOpen: boolean;
    onClose: () => void;
    filters: {
        store: string;
        meatGroup?: string;
        period?: string; // Only for History
    };
    setFilter: (key: string, value: string) => void;
    stores: Array<{ id: string; name: string }>;
    meatGroups?: string[];
    type: 'dashboard' | 'history';
}

export const ButcherFilterModal: React.FC<ButcherFilterModalProps> = ({
    isOpen,
    onClose,
    filters,
    setFilter,
    stores,
    meatGroups = [],
    type
}) => {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content glass" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>Filtrar {type === 'dashboard' ? 'Pedidos' : 'Histórico'}</h2>
                    <button onClick={onClose} className="close-btn">
                        <X size={24} />
                    </button>
                </div>

                <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

                    {/* Period Filter (History Only) */}
                    {type === 'history' && filters.period && (
                        <div className="form-group">
                            <label className="arbalest-label">Período</label>
                            <select
                                className="arbalest-select"
                                value={filters.period}
                                onChange={(e) => setFilter('period', e.target.value)}
                            >
                                <option value="today">Hoje</option>
                                <option value="7_days">Últimos 7 Dias</option>
                                <option value="30_days">Últimos 30 Dias</option>
                                <option value="all">Todo o Período</option>
                            </select>
                        </div>
                    )}

                    {/* Store Filter */}
                    <div className="form-group">
                        <label className="arbalest-label">Loja</label>
                        <select
                            className="arbalest-select"
                            value={filters.store}
                            onChange={(e) => setFilter('store', e.target.value)}
                        >
                            <option value="all">Todas as Lojas</option>
                            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                    </div>

                    {/* Meat Group Filter */}
                    <div className="form-group">
                        <label className="arbalest-label">Grupo de Carne</label>
                        <select
                            className="arbalest-select"
                            value={filters.meatGroup || 'all'}
                            onChange={(e) => setFilter('meatGroup', e.target.value)}
                        >
                            <option value="all">Todos os Grupos</option>
                            {meatGroups.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>

                </div>

                <div className="modal-footer">
                    <button className="arbalest-btn arbalest-btn-primary" onClick={onClose} style={{ width: '100%' }}>
                        Aplicar Filtros
                    </button>
                </div>
            </div>
        </div>
    );
};
