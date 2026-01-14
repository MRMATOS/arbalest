import React, { useState } from 'react';
import { Plus, X } from 'lucide-react';
import { MODULE_FUNCTIONS, MODULE_LABELS, FUNCTION_LABELS, type ModuleName, type UserPermissions } from '../types/permissions';

interface Store {
    id: string;
    name: string;
    code: string;
}

interface ModuleAccessEditorProps {
    permissions: UserPermissions;
    onChange: (permissions: UserPermissions) => void;
    stores: Store[];
}

export const ModuleAccessEditor: React.FC<ModuleAccessEditorProps> = ({ permissions, onChange, stores }) => {
    const [selectedModule, setSelectedModule] = useState<ModuleName | ''>('');
    const [selectedFunction, setSelectedFunction] = useState('');
    const [selectedStore, setSelectedStore] = useState<string | 'all'>('');

    const handleAddAccess = () => {
        if (!selectedModule || !selectedFunction || !selectedStore) return;

        const newPermissions = {
            ...permissions,
            [selectedModule]: {
                function: selectedFunction,
                store_id: selectedStore === 'all' ? null : selectedStore,
            },
        };

        onChange(newPermissions);
        setSelectedModule('');
        setSelectedFunction('');
        setSelectedStore('');
    };

    const handleRemoveAccess = (module: ModuleName) => {
        const newPermissions = { ...permissions };
        delete newPermissions[module];
        onChange(newPermissions);
    };

    const availableModules = Object.keys(MODULE_LABELS).filter(
        (mod) => !permissions[mod as ModuleName]
    ) as ModuleName[];

    const availableFunctions = selectedModule ? MODULE_FUNCTIONS[selectedModule] : [];

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Current Permissions */}
            <div>
                <label className="arbalest-label" style={{ marginBottom: '8px', display: 'block' }}>
                    Acessos Atuais
                </label>
                {Object.keys(permissions).length === 0 ? (
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                        Nenhum acesso configurado
                    </p>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {(Object.keys(permissions) as ModuleName[]).map((module) => {
                            const access = permissions[module]!;
                            const storeName = access.store_id === null
                                ? '🌐 Todas as lojas'
                                : stores.find(s => s.id === access.store_id)?.name || 'Loja não encontrada';

                            return (
                                <div
                                    key={module}
                                    className="arbalest-glass"
                                    style={{
                                        padding: '12px',
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        <strong style={{ fontSize: '0.95rem' }}>{MODULE_LABELS[module]}</strong>
                                        <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                                            · {FUNCTION_LABELS[access.function]}
                                        </span>
                                        <span style={{ color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                                            · {storeName}
                                        </span>
                                    </div>
                                    <button
                                        type="button"
                                        className="arbalest-icon-btn"
                                        onClick={() => handleRemoveAccess(module)}
                                        style={{ color: 'var(--error)' }}
                                        title="Remover acesso"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Add New Access */}
            {availableModules.length > 0 && (
                <div>
                    <label className="arbalest-label" style={{ marginBottom: '8px', display: 'block' }}>
                        Adicionar Acesso
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        <select
                            value={selectedModule}
                            onChange={(e) => {
                                setSelectedModule(e.target.value as ModuleName);
                                setSelectedFunction('');
                                setSelectedStore('');
                            }}
                            className="arbalest-select"
                            style={{ flex: '1 1 200px' }}
                        >
                            <option value="">Selecione o módulo...</option>
                            {availableModules.map((mod) => (
                                <option key={mod} value={mod}>
                                    {MODULE_LABELS[mod]}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedFunction}
                            onChange={(e) => setSelectedFunction(e.target.value)}
                            className="arbalest-select"
                            style={{ flex: '1 1 200px' }}
                            disabled={!selectedModule}
                        >
                            <option value="">Selecione a função...</option>
                            {availableFunctions.map((func) => (
                                <option key={func} value={func}>
                                    {FUNCTION_LABELS[func]}
                                </option>
                            ))}
                        </select>

                        <select
                            value={selectedStore}
                            onChange={(e) => setSelectedStore(e.target.value)}
                            className="arbalest-select"
                            style={{ flex: '1 1 200px' }}
                            disabled={!selectedModule || !selectedFunction}
                        >
                            <option value="">Selecione a loja...</option>
                            <option value="all">🌐 Todas as lojas</option>
                            {stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    🏪 {store.name} ({store.code})
                                </option>
                            ))}
                        </select>

                        <button
                            type="button"
                            onClick={handleAddAccess}
                            disabled={!selectedModule || !selectedFunction || !selectedStore}
                            className="arbalest-btn arbalest-btn-primary"
                            style={{
                                opacity: !selectedModule || !selectedFunction || !selectedStore ? 0.5 : 1,
                                cursor: !selectedModule || !selectedFunction || !selectedStore ? 'not-allowed' : 'pointer',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            <Plus size={18} />
                            <span>Adicionar</span>
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
