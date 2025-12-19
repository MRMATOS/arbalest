import React, { useState } from 'react';
import { X, Check, Clock, Calendar, ListChecks, ArrowLeft } from 'lucide-react';
import { Modal } from '../../components/Modal';
import type { ValidityEntry } from '../../hooks/useValidityEntries';
import './ExportValidityModal.css';

interface ExportValidityModalProps {
    isOpen: boolean;
    onClose: () => void;
    entries: ValidityEntry[];
}

export const ExportValidityModal: React.FC<ExportValidityModalProps> = ({ isOpen, onClose, entries }) => {
    const [view, setView] = useState<'menu' | 'selection'>('menu');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [copied, setCopied] = useState<string | null>(null);

    // Reset state when modal opens/closes
    React.useEffect(() => {
        if (isOpen) {
            setView('menu');
            setSelectedIds(new Set());
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const copyToClipboard = async (type: 'today' | 'hour' | 'all' | 'manual') => {
        const now = new Date();
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

        const verifiedEntries = entries.filter(e => e.status === 'conferido');

        let filtered = verifiedEntries;
        let title = "";

        if (type === 'today') {
            filtered = verifiedEntries.filter(e => {
                const dateStr = e.verified_at || e.updated_at || e.created_at;
                if (!dateStr) return false;
                const date = new Date(dateStr);
                return date >= startOfToday;
            });
            title = "CONFERIDOS HOJE";
        } else if (type === 'hour') {
            filtered = verifiedEntries.filter(e => {
                const dateStr = e.verified_at || e.updated_at || e.created_at;
                if (!dateStr) return false;
                const date = new Date(dateStr);
                return date >= oneHourAgo;
            });
            title = "CONFERIDOS NA ÚLTIMA HORA";
        } else if (type === 'manual') {
            filtered = entries.filter(e => selectedIds.has(e.id));
            title = "SELEÇÃO MANUAL";
        } else {
            title = "TODOS CONFERIDOS";
        }

        if (filtered.length === 0) {
            alert("Nenhum item selecionado ou encontrado.");
            return;
        }

        const text = `*${title} - ${now.toLocaleDateString()} ${now.toLocaleTimeString()}*\n\n` +
            filtered.map(e => {
                return `✅ ${e.quantity}x ${e.product.name}\n   Venc: ${new Date(e.expires_at).toLocaleDateString()} | Lote: ${e.lot || 'N/A'}`;
            }).join('\n\n');

        try {
            await navigator.clipboard.writeText(text);
            setCopied(type);
            setTimeout(() => setCopied(null), 2000);
        } catch (err) {
            console.error('Failed to copy', err);
            alert('Falha ao copiar para área de transferência');
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const toggleSelectAll = () => {
        if (selectedIds.size === entries.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(entries.map(e => e.id)));
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            showCloseButton={false} // Custom header logic below
            className={`export-modal ${view === 'selection' ? 'wide' : ''}`}
        >
            <div className="modal-header">
                {view === 'selection' ? (
                    <div className="header-title-with-back">
                        <button className="back-btn" onClick={() => setView('menu')}>
                            <ArrowLeft size={20} />
                        </button>
                        <h3>Seleção Manual</h3>
                    </div>
                ) : (
                    <h3>Exportar Conferência</h3>
                )}
                <button className="close-btn" onClick={onClose}>
                    <X size={20} />
                </button>
            </div>

            <div className="modal-body-export-wrapper">
                {view === 'menu' ? (
                    <>
                        <p className="modal-description">
                            Selecione o método de exportação:
                        </p>

                        <div className="export-options">
                            <button
                                className="export-btn"
                                onClick={() => setView('selection')}
                            >
                                <div className="btn-icon">
                                    <ListChecks size={24} />
                                </div>
                                <div className="btn-info">
                                    <span className="btn-title">Seleção Manual</span>
                                    <span className="btn-desc">Escolher itens da lista</span>
                                </div>
                            </button>

                            <button
                                className={`export-btn ${copied === 'hour' ? 'success' : ''}`}
                                onClick={() => copyToClipboard('hour')}
                            >
                                <div className="btn-icon">
                                    {copied === 'hour' ? <Check size={24} /> : <Clock size={24} />}
                                </div>
                                <div className="btn-info">
                                    <span className="btn-title">{copied === 'hour' ? 'Copiado!' : 'Última Hora'}</span>
                                    <span className="btn-desc">{copied === 'hour' ? 'Texto copiado para área de transferência' : 'Registros recentes'}</span>
                                </div>
                            </button>

                            <button
                                className={`export-btn ${copied === 'today' ? 'success' : ''}`}
                                onClick={() => copyToClipboard('today')}
                            >
                                <div className="btn-icon">
                                    {copied === 'today' ? <Check size={24} /> : <Calendar size={24} />}
                                </div>
                                <div className="btn-info">
                                    <span className="btn-title">{copied === 'today' ? 'Copiado!' : 'Hoje'}</span>
                                    <span className="btn-desc">{copied === 'today' ? 'Texto copiado para área de transferência' : 'Todo o dia atual'}</span>
                                </div>
                            </button>

                            <button
                                className={`export-btn ${copied === 'all' ? 'success' : ''}`}
                                onClick={() => copyToClipboard('all')}
                            >
                                <div className="btn-icon">
                                    {copied === 'all' ? <Check size={24} /> : <ListChecks size={24} />}
                                </div>
                                <div className="btn-info">
                                    <span className="btn-title">{copied === 'all' ? 'Copiado!' : 'Tudo'}</span>
                                    <span className="btn-desc">{copied === 'all' ? 'Texto copiado para área de transferência' : 'Todos conferidos'}</span>
                                </div>
                            </button>
                        </div>
                    </>
                ) : (
                    <div className="selection-view">
                        <div className="selection-toolbar">
                            <label className="select-all-label">
                                <input
                                    type="checkbox"
                                    checked={entries.length > 0 && selectedIds.size === entries.length}
                                    onChange={toggleSelectAll}
                                />
                                Selecionar Todos ({entries.length})
                            </label>
                            <span className="selection-count">{selectedIds.size} selecionados</span>
                        </div>

                        <div className="selection-list">
                            {entries.map(entry => (
                                <div key={entry.id} className="selection-item" onClick={() => toggleSelection(entry.id)}>
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(entry.id)}
                                        onChange={() => { }} // Handle by parent div click
                                        readOnly
                                    />
                                    <div className="item-info">
                                        <span className="item-name">{entry.product.name}</span>
                                        <span className="item-code">{entry.product.code} | {new Date(entry.expires_at).toLocaleDateString()}</span>
                                    </div>
                                    <div className="item-status">
                                        {entry.status === 'conferido' && <Check size={14} color="var(--success)" />}
                                    </div>
                                </div>
                            ))}
                        </div>

                        <button
                            className={`copy-selected-btn ${copied === 'manual' ? 'success' : ''}`}
                            onClick={() => copyToClipboard('manual')}
                            disabled={selectedIds.size === 0}
                        >
                            {copied === 'manual' ? (
                                <>Copiado! <Check size={18} /></>
                            ) : (
                                <>Copiar Selecionados <ListChecks size={18} /></>
                            )}
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
};
