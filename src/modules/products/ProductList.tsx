import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';
import { Search, Plus, Edit2, Trash2, Package as PackageIcon } from 'lucide-react';
import './ProductList.css';
import ProductModal from './ProductModal';

interface Product {
    id: string;
    code: string;
    ean: string | null;
    name: string;
    supplier: string | null;
    type: string | null;
    is_active: boolean;
}

export const ProductList: React.FC = () => {
    const { user } = useAuth();
    const isAdmin = user?.is_admin;

    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState<Product | undefined>(undefined);

    const ITEMS_PER_PAGE = 50;
    const observer = useRef<IntersectionObserver | null>(null);

    const lastElementRef = useCallback((node: HTMLDivElement | null) => {
        if (loading) return;
        if (observer.current) observer.current.disconnect();
        observer.current = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore) {
                setPage(prev => prev + 1);
            }
        });
        if (node) observer.current.observe(node);
    }, [loading, hasMore]);

    const fetchProducts = useCallback(async (reset = false) => {
        if (loading) return;
        setLoading(true);

        try {
            let query = supabase
                .from('products')
                .select('*')
                .order('name', { ascending: true })
                .range(
                    (reset ? 0 : page) * ITEMS_PER_PAGE,
                    ((reset ? 0 : page) + 1) * ITEMS_PER_PAGE - 1
                );

            if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,code.ilike.%${searchTerm}%,ean.ilike.%${searchTerm}%`);
            }

            const { data, error } = await query;

            if (error) throw error;

            if (data) {
                setProducts(prev => reset ? data : [...prev, ...data]);
                setHasMore(data.length === ITEMS_PER_PAGE);
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    }, [loading, page, searchTerm]);

    useEffect(() => {
        setPage(0);
        fetchProducts(true);
    }, [user?.store_id, fetchProducts]);

    useEffect(() => {
        if (page > 0) fetchProducts();
    }, [page, fetchProducts]);

    const handleAdd = () => {
        setSelectedProduct(undefined);
        setIsModalOpen(true);
    };

    const handleEdit = (product: Product) => {
        setSelectedProduct(product);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Deseja realmente desativar este produto?')) return;

        const { error } = await supabase
            .from('products')
            .update({ is_active: false })
            .eq('id', id);

        if (!error) {
            setProducts(prev => prev.map(p => p.id === id ? { ...p, is_active: false } : p));
        }
    };

    return (
        <div className="products-container">
            <div className="products-header">
                <h1>Produtos</h1>
                {isAdmin && (
                    <button className="btn-add-product" onClick={handleAdd}>
                        <Plus size={20} />
                        Adicionar Produto
                    </button>
                )}
            </div>

            <div className="products-controls">
                <div className="search-input-wrapper">
                    <Search size={20} className="text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nome, EAN ou código..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="products-table-container">
                <table className="products-table">
                    <thead>
                        <tr>
                            <th style={{ width: '80px' }}>Status</th>
                            <th>Código</th>
                            <th>Produto</th>
                            <th>EAN</th>
                            <th>Fornecedor</th>
                            <th>Tipo</th>
                            {isAdmin && <th style={{ width: '100px' }}>Ações</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {products.map((product, index) => (
                            <tr key={product.id} ref={index === products.length - 1 ? lastElementRef : null}>
                                <td>
                                    <span className={`status-badge ${product.is_active ? 'active' : 'inactive'}`}>
                                        {product.is_active ? 'Ativo' : 'Inativo'}
                                    </span>
                                </td>
                                <td>{product.code}</td>
                                <td>{product.name}</td>
                                <td>{product.ean || '-'}</td>
                                <td>{product.supplier || '-'}</td>
                                <td>{product.type || '-'}</td>
                                {isAdmin && (
                                    <td>
                                        <div className="actions-cell">
                                            <button className="action-btn" title="Editar" onClick={() => handleEdit(product)}>
                                                <Edit2 size={18} />
                                            </button>
                                            {product.is_active && (
                                                <button className="action-btn delete" title="Desativar" onClick={() => handleDelete(product.id)}>
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                )}
                            </tr>
                        ))}
                        {!loading && products.length === 0 && (
                            <tr>
                                <td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: '40px' }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px', color: 'var(--text-tertiary)' }}>
                                        <PackageIcon size={48} strokeWidth={1} />
                                        <p>Nenhum produto encontrado</p>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {loading && <div className="pagination-loader">Carregando...</div>}

            <ProductModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} product={selectedProduct} onSuccess={() => fetchProducts(true)} />
        </div>
    );
};
