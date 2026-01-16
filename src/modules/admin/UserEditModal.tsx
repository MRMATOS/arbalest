import React, { useEffect, useState } from 'react';
import { X, Save, Lock, Mail, Plus, Trash2, Pencil, Eye, EyeOff, User } from 'lucide-react';
import type { Profile } from '../../contexts/AuthContext';
import { AddAccessModal } from './AddAccessModal';

interface StoreType {
    id: string;
    name: string;
    code: string;
}

interface UserEditModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: Profile | null;
    stores: StoreType[];
    onSave: (userId: string | null, updates: any) => Promise<void>;
}

const MODULE_LABELS: Record<string, string> = {
    validity: 'Gestão de Validade',
    butcher: 'Açougue',
    planogram: 'Planogramas',
};

const FUNCTION_LABELS: Record<string, string> = {
    conferente: 'Conferente',
    encarregado: 'Encarregado',
    visitante: 'Visitante',
    solicitante: 'Solicitante',
    gerente: 'Gerente',
    editor: 'Editor',
};

export const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, user, stores, onSave }) => {
    const [formData, setFormData] = useState<Partial<Profile> & { password?: string; confirmPassword?: string }>({
        is_admin: false,
        permissions: {},
    });
    const [saving, setSaving] = useState(false);
    const [isAddAccessModalOpen, setIsAddAccessModalOpen] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [editingAccess, setEditingAccess] = useState<{
        module: string;
        access: { function: string; store_id: string | null };
    } | null>(null);

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    username: user.username || '',
                    role: user.role,
                    butcher_role: user.butcher_role,
                    is_admin: user.is_admin || false,
                    permissions: user.permissions || {},
                });
            } else {
                setFormData({
                    role: null,
                    email: '',
                    password: '',
                    is_admin: false,
                    permissions: {},
                });
            }
        }
    }, [user, isOpen]);

    // Close on Escape key
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    const isEditing = !!user;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEditing) {
            if (!formData.email) {
                alert('Email é obrigatório.');
                return;
            }
            if (!formData.password || formData.password.length < 6) {
                alert('A senha deve ter pelo menos 6 caracteres.');
                return;
            }
        }

        setSaving(true);
        try {
            console.log('💾 UserEditModal - Salvando usuário:', {
                userId: user?.id,
                isEditing,
                formData: {
                    ...formData,
                    password: formData.password ? '***' : undefined
                },
                permissions: formData.permissions
            });

            await onSave(user ? user.id : null, formData);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário');
        } finally {
            setSaving(false);
        }
    };

    const handleRemoveAccess = (module: string) => {
        const newPermissions = { ...formData.permissions };
        delete newPermissions[module as keyof typeof newPermissions];
        setFormData({ ...formData, permissions: newPermissions });
    };

    const handleEditAccess = (module: string) => {
        const access = (formData.permissions as any)?.[module];
        if (access) {
            setEditingAccess({ module, access });
            setIsAddAccessModalOpen(true);
        }
    };

    const getStoreName = (storeId: string | null) => {
        if (storeId === null) return '🌐 Todas as lojas';
        const store = stores.find(s => s.id === storeId);
        return store ? store.name : 'Loja desconhecida';
    };


    return (
        <>
            <div className="arbalest-modal-overlay" onClick={onClose}>
                <div
                    className="arbalest-modal arbalest-glass"
                    style={{ maxWidth: '500px' }}
                    onClick={e => e.stopPropagation()}
                >
                    <div className="arbalest-modal-header">
                        <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                        <button onClick={onClose} className="arbalest-icon-btn">
                            <X size={24} />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="arbalest-form">
                        {/* Name Field (Optional) */}
                        <div className="arbalest-form-group">
                            <label>
                                <User size={16} />
                                Nome (Opcional)
                            </label>
                            <input
                                type="text"
                                value={formData.name || ''}
                                onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                                className="arbalest-input"
                                placeholder="Nome completo"
                            />
                        </div>

                        <div className="arbalest-form-group">
                            <label>
                                <Mail size={16} />
                                Email
                            </label>
                            <input
                                type="email"
                                value={formData.email || ''}
                                onChange={e => setFormData(prev => ({ ...prev, email: e.target.value }))}
                                className="arbalest-input"
                                placeholder="Ex: usuario@loja.com"
                                required
                                disabled={isEditing}
                                title={isEditing ? "Não é possível alterar o email." : "Obrigatório para login"}
                            />
                        </div>

                        {!isEditing && (
                            <div className="arbalest-form-group">
                                <label>
                                    <Lock size={16} />
                                    Senha Inicial
                                </label>
                                <div className="arbalest-search-wrapper">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password || ''}
                                        onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                        placeholder="Mínimo 6 caracteres"
                                        required
                                        style={{
                                            background: 'transparent',
                                            border: 'none',
                                            color: 'var(--text-primary)',
                                            width: '100%',
                                            outline: 'none'
                                        }}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="arbalest-icon-btn"
                                        style={{ padding: '4px' }}
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        )}

                        {!formData.is_admin && (
                            <div className="arbalest-form-group">
                                <label style={{ marginBottom: '12px', display: 'block', color: 'var(--text-secondary)' }}>
                                    Acessos Atuais
                                </label>

                                {/* Access List */}
                                {Object.entries(formData.permissions || {}).length > 0 ? (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '12px' }}>
                                        {Object.entries(formData.permissions || {}).map(([module, access]) => (
                                            <div
                                                key={module}
                                                style={{
                                                    background: 'rgba(255, 255, 255, 0.03)',
                                                    border: '1px solid rgba(255, 255, 255, 0.1)',
                                                    padding: '12px',
                                                    borderRadius: '8px',
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <div>
                                                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                                        {MODULE_LABELS[module] || module}
                                                    </div>
                                                    <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                                                        {FUNCTION_LABELS[access.function] || access.function} · {getStoreName(access.store_id)}
                                                    </div>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleEditAccess(module)}
                                                        className="arbalest-icon-btn"
                                                        title="Editar acesso"
                                                    >
                                                        <Pencil size={18} />
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemoveAccess(module)}
                                                        className="arbalest-icon-btn"
                                                        style={{ color: 'var(--danger)' }}
                                                        title="Remover acesso"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div style={{
                                        padding: '20px',
                                        textAlign: 'center',
                                        color: 'var(--text-secondary)',
                                        fontSize: '0.9rem'
                                    }}>
                                        Nenhum acesso configurado
                                    </div>
                                )}

                                {/* Add Access Button */}
                                <button
                                    type="button"
                                    onClick={() => setIsAddAccessModalOpen(true)}
                                    className="arbalest-btn arbalest-btn-primary"
                                    style={{ width: '100%' }}
                                >
                                    <Plus size={18} />
                                    Adicionar Acesso
                                </button>
                            </div>
                        )}

                        <div className="arbalest-form-group">
                            <label className="arbalest-checkbox-label" style={{ cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    checked={formData.is_admin || false}
                                    onChange={(e) => setFormData({ ...formData, is_admin: e.target.checked })}
                                    style={{ cursor: 'pointer' }}
                                />
                                <span>🔑 Administrador do Sistema</span>
                            </label>
                        </div>

                        <div className="arbalest-form-actions">
                            <button type="button" onClick={onClose} className="arbalest-btn arbalest-btn-neutral" disabled={saving}>
                                Cancelar
                            </button>
                            <button type="submit" className="arbalest-btn arbalest-btn-primary" disabled={saving}>
                                {saving ? 'Processando...' : (isEditing ? 'Salvar Alterações' : 'Criar Usuário')}
                                <Save size={18} />
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <AddAccessModal
                isOpen={isAddAccessModalOpen}
                onClose={() => {
                    setIsAddAccessModalOpen(false);
                    setEditingAccess(null);
                }}
                onSave={(newPermissions) => {
                    setFormData({ ...formData, permissions: newPermissions });
                    setEditingAccess(null);
                }}
                currentPermissions={formData.permissions || {}}
                stores={stores}
                initialValues={editingAccess ? {
                    module: editingAccess.module as any,
                    function: editingAccess.access.function,
                    store_id: editingAccess.access.store_id
                } : null}
            />
        </>
    );
};
