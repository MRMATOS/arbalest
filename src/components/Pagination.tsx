import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems?: number;
    itemsPerPage?: number;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage = 10,
}) => {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems || currentPage * itemsPerPage);

    return (
        <div className="pagination-controls" style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '16px 0',
            marginTop: '16px',
        }}>
            <button
                className="arbalest-icon-btn"
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1}
                style={{
                    opacity: currentPage === 1 ? 0.4 : 1,
                    cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-color)',
                }}
                title="Página anterior"
            >
                <ChevronLeft size={20} />
            </button>

            <span style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                minWidth: '120px',
                textAlign: 'center',
            }}>
                Página <strong style={{ color: 'var(--text-primary)' }}>{currentPage}</strong> de <strong style={{ color: 'var(--text-primary)' }}>{totalPages}</strong>
            </span>

            <button
                className="arbalest-icon-btn"
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                style={{
                    opacity: currentPage === totalPages ? 0.4 : 1,
                    cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                    padding: '8px',
                    borderRadius: '8px',
                    background: 'var(--surface-secondary)',
                    border: '1px solid var(--border-color)',
                }}
                title="Próxima página"
            >
                <ChevronRight size={20} />
            </button>

            {totalItems !== undefined && (
                <span style={{
                    color: 'var(--text-tertiary)',
                    fontSize: '0.8rem',
                    marginLeft: '8px',
                }}>
                    ({startItem}-{endItem} de {totalItems})
                </span>
            )}
        </div>
    );
};
