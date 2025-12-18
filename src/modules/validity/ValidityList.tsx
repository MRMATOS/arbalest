import React, { useState } from 'react';
import {
    AlertCircle,
    CheckCircle2,
    ChevronRight,
    Clock,
    Copy,
    MoreVertical,
    Plus,
    Search
} from 'lucide-react';
import { useValidityEntries } from '../../hooks/useValidityEntries';
import './ValidityList.css';

export const ValidityList: React.FC = () => {
    const { entries, loading, error, refresh } = useValidityEntries();
    const [searchTerm, setSearchTerm] = useState('');

    if (loading && entries.length === 0) {
        return (
            <div className="loading-state">
                <div className="spinner" />
                <p>Carregando registros...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-state glass">
                <AlertCircle size={32} color="var(--error)" />
                <p>Erro ao carregar dados: {error}</p>
                <button onClick={refresh} className="retry-btn">Tentar novamente</button>
            </div>
        );
    }

    // Filter local results based on search term
    const filteredEntries = entries.filter(item =>
        item.product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.product.ean?.includes(searchTerm) ||
        item.product.code.includes(searchTerm)
    );

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'conferido': return <span className="status-badge success"><CheckCircle2 size={14} /> Conferido</span>;
            case 'conferindo': return <span className="status-badge warning"><Clock size={14} /> Conferindo</span>;
            default: return <span className="status-badge info">Ativo</span>;
        }
    };

    const getExpiryDays = (date: string) => {
        const diff = new Date(date).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 3600 * 24));
    };

    const getExpiryClass = (date: string) => {
        const days = getExpiryDays(date);
        if (days < 0) return 'expired';
        if (days <= 7) return 'critical';
        if (days <= 30) return 'warning';
        return '';
    };

    return (
        <div className="validity-container">
            <div className="page-header">
                <div className="header-text">
                    <h1>Lista de Validades</h1>
                    <p>Gerencie os produtos próximos do vencimento</p>
                </div>
                <button className="add-btn">
                    <Plus size={20} />
                    <span>Novo Registro</span>
                </button>
            </div>

            <div className="filter-section glass">
                <div className="search-wrapper">
                    <Search size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por EAN, código ou nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Desktop Table View */}
            <div className="desktop-view glass">
                <table className="validity-table">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Código / EAN</th>
                            <th>Status</th>
                            <th>Qtd.</th>
                            <th>Validade</th>
                            <th>Lote</th>
                            <th className="actions-col"></th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredEntries.map(item => (
                            <tr key={item.id}>
                                <td className="product-col">
                                    <span className="product-name">{item.product.name}</span>
                                </td>
                                <td className="code-col">
                                    <div className="code-info">
                                        <span className="code">{item.product.code}</span>
                                        <span className="ean">{item.product.ean}</span>
                                    </div>
                                </td>
                                <td>{getStatusBadge(item.status)}</td>
                                <td><span className="quantity">{item.quantity}</span></td>
                                <td>
                                    <div className={`expiry-info ${getExpiryClass(item.expires_at)}`}>
                                        <span className="date">{new Date(item.expires_at).toLocaleDateString()}</span>
                                        <span className="days">{getExpiryDays(item.expires_at)}d restantes</span>
                                    </div>
                                </td>
                                <td><span className="lot-tag">{item.lot}</span></td>
                                <td className="actions-col">
                                    <button className="icon-btn"><MoreVertical size={18} /></button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="mobile-view">
                <div className="card-list">
                    {filteredEntries.map(item => (
                        <div key={item.id} className="validity-card glass">
                            <div className="card-header">
                                <span className="product-name">{item.product.name}</span>
                                {getStatusBadge(item.status)}
                            </div>

                            <div className="card-body">
                                <div className="card-info">
                                    <label>EAN / CÓD</label>
                                    <span>{item.product.ean} / {item.product.code}</span>
                                </div>

                                <div className="card-row">
                                    <div className="card-info">
                                        <label>Quantidade</label>
                                        <span className="quantity-val">{item.quantity} un</span>
                                    </div>
                                    <div className="card-info">
                                        <label>Lote</label>
                                        <span className="lot-tag">{item.lot}</span>
                                    </div>
                                </div>

                                <div className={`card-expiry ${getExpiryClass(item.expires_at)}`}>
                                    <div className="expiry-main">
                                        <Clock size={16} />
                                        <span>Vence em: {new Date(item.expires_at).toLocaleDateString()}</span>
                                    </div>
                                    <span className="days-left">{getExpiryDays(item.expires_at)} dias</span>
                                </div>
                            </div>

                            <div className="card-footer">
                                <button className="card-action secondary"><Copy size={16} /> Copiar</button>
                                <button className="card-action primary">Ver Detalhes <ChevronRight size={16} /></button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};
