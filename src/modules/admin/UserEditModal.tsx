import React, { useEffect, useState } from 'react';
import { X, Save, User, UserCheck, Briefcase, Beef, Store as StoreIcon, Lock, Mail } from 'lucide-react';
import type { Profile } from '../../contexts/AuthContext';


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

export const UserEditModal: React.FC<UserEditModalProps> = ({ isOpen, onClose, user, stores, onSave }) => {
    const [formData, setFormData] = useState<Partial<Profile> & { password?: string; confirmPassword?: string }>({});
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (isOpen) {
            if (user) {
                setFormData({
                    name: user.name || '',
                    email: user.email || '',
                    username: user.username || '',
                    role: user.role,
                    butcher_role: user.butcher_role,
                    store_id: user.store_id
                });
            } else {
                setFormData({
                    role: 'conferente', // default role
                    name: '',
                    email: '',
                    username: '',
                    password: '',
                    confirmPassword: ''
                });
            }
        }
    }, [user, isOpen]);

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
            if (formData.password !== formData.confirmPassword) {
                alert('As senhas não coincidem.');
                return;
            }
        }

        setSaving(true);
        try {
            await onSave(user ? user.id : null, formData);
            onClose();
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Erro ao salvar usuário');
        } finally {
            setSaving(false);
        }
    };

    const handleRoleChange = (newRole: string) => {
        const updates: Partial<Profile> = { role: newRole as any };

        // Reset butcher role if not butcher-related
        if (newRole !== 'acougue' && newRole !== 'admin') {
            updates.butcher_role = null;
        }

        setFormData(prev => ({ ...prev, ...updates }));
    };

    return (
        <div className="arbalest-modal-overlay">
            <div className="arbalest-modal arbalest-glass" style={{ maxWidth: '500px' }}>
                <div className="arbalest-modal-header">
                    <h2>{isEditing ? 'Editar Usuário' : 'Novo Usuário'}</h2>
                    <button onClick={onClose} className="arbalest-icon-btn">
                        <X size={24} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="arbalest-form">
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

                    <div className="arbalest-form-group">
                        <label>
                            <User size={16} />
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={formData.name || ''}
                            onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="arbalest-input"
                            placeholder="Ex: João da Silva"
                            required
                        />
                    </div>

                    <div className="arbalest-form-group">
                        <label>
                            <UserCheck size={16} />
                            Nome de Usuário (Login)
                        </label>
                        <input
                            type="text"
                            value={formData.username || ''}
                            onChange={e => setFormData(prev => ({ ...prev, username: e.target.value }))}
                            className="arbalest-input"
                            placeholder="Ex: joao.silva"
                            required
                        />
                    </div>

                    {!isEditing && (
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div className="arbalest-form-group">
                                <label>
                                    <Lock size={16} />
                                    Senha Inicial
                                </label>
                                <input
                                    type="password"
                                    value={formData.password || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, password: e.target.value }))}
                                    className="arbalest-input"
                                    placeholder="******"
                                    required
                                />
                            </div>
                            <div className="arbalest-form-group">
                                <label>
                                    <Lock size={16} />
                                    Confirmar
                                </label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword || ''}
                                    onChange={e => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                                    className="arbalest-input"
                                    placeholder="******"
                                    required
                                />
                            </div>
                        </div>
                    )}

                    <div className="arbalest-form-group">
                        <label>
                            <Briefcase size={16} />
                            Cargo do Sistema
                        </label>
                        <select
                            value={formData.role}
                            onChange={e => handleRoleChange(e.target.value)}
                            className="arbalest-select"
                        >
                            <option value="conferente">Conferente</option>
                            <option value="encarregado">Encarregado</option>
                            <option value="planogram_edit">Planograma (Editor)</option>
                            <option value="planogram_view">Planograma (Visualizador)</option>
                            <option value="acougue">Açougue (Restrito)</option>
                            <option value="admin">Administrador</option>
                        </select>
                    </div>

                    {(formData.role === 'acougue' || formData.role === 'admin' || formData.butcher_role) && (
                        <div className="arbalest-form-group">
                            <label>
                                <Beef size={16} />
                                Nível de Acesso (Açougue)
                            </label>
                            <select
                                value={formData.butcher_role || ''}
                                onChange={e => setFormData(prev => ({ ...prev, butcher_role: e.target.value as any || null }))}
                                className="arbalest-select"
                                required={formData.role === 'acougue'}
                            >
                                <option value="">Nenhum</option>
                                <option value="requester">Solicitante</option>
                                <option value="producer">Produção</option>
                                <option value="manager">Gerente (Solicita + Produz)</option>
                            </select>
                        </div>
                    )}

                    <div className="arbalest-form-group">
                        <label>
                            <StoreIcon size={16} />
                            Loja Vinculada
                        </label>
                        <select
                            value={formData.store_id || ''}
                            onChange={e => setFormData(prev => ({ ...prev, store_id: e.target.value || null }))}
                            className="arbalest-select"
                        >
                            <option value="">Selecione uma loja...</option>
                            {stores.map(store => (
                                <option key={store.id} value={store.id}>
                                    {store.name} ({store.code})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="arbalest-modal-actions">
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
    );
};
