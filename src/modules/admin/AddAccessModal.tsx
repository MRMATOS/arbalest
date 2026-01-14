import React, { useState } from 'react';
import { Modal } from '../../components/Modal';
import type { UserPermissions, ModuleName } from '../../types/permissions';

interface Store {
    id: string;
    name: string;
}

interface AddAccessModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (permissions: UserPermissions) => void;
    currentPermissions: UserPermissions;
    stores: Store[];
    initialValues?: {
        module: ModuleName;
        function: string;
        store_id: string | null;
    } | null;
}

const MODULE_OPTIONS: { value: ModuleName; label: string }[] = [
    { value: 'validity', label: 'Gestão de Validade' },
    { value: 'butcher', label: 'Açougue' },
    { value: 'planogram', label: 'Planogramas' },
];

const FUNCTION_OPTIONS: Partial<Record<ModuleName, { value: string; label: string }[]>> = {
    validity: [
        { value: 'conferente', label: 'Conferente' },
        { value: 'encarregado', label: 'Encarregado' },
        { value: 'visitante', label: 'Visitante' },
    ],
    butcher: [
        { value: 'solicitante', label: 'Solicitante' },
        { value: 'producao', label: 'Produção' },
        { value: 'gerente', label: 'Gerente' },
        { value: 'visitante', label: 'Visitante' },
    ],
    planogram: [
        { value: 'editor', label: 'Editor' },
        { value: 'visitante', label: 'Visitante' },
    ],
};

export const AddAccessModal: React.FC<AddAccessModalProps> = ({
    isOpen,
    onClose,
    onSave,
    currentPermissions,
    stores,
    initialValues,
}) => {
    const [selectedModule, setSelectedModule] = useState<ModuleName | ''>('');
    const [selectedFunction, setSelectedFunction] = useState('');
    const [selectedStore, setSelectedStore] = useState<string | null>(null);

    React.useEffect(() => {
        if (isOpen && initialValues) {
            setSelectedModule(initialValues.module);
            setSelectedFunction(initialValues.function);
            setSelectedStore(initialValues.store_id);
        } else if (isOpen) {
            // Reset if opening effectively new
            setSelectedModule('');
            setSelectedFunction('');
            setSelectedStore(null);
        }
    }, [isOpen, initialValues]);

    const handleSave = () => {
        if (!selectedModule || !selectedFunction) {
            alert('Por favor, selecione o módulo e a função');
            return;
        }

        // Fix: Convert empty string to null for store_id
        const storeIdValue = selectedStore === '' ? null : selectedStore;

        const newPermissions = {
            ...currentPermissions,
            [selectedModule]: {
                function: selectedFunction,
                store_id: storeIdValue,
            },
        };

        console.log('🔧 AddAccessModal - Salvando acesso:', {
            module: selectedModule,
            function: selectedFunction,
            store_id: storeIdValue,
            fullPermissions: newPermissions
        });

        onSave(newPermissions);
        handleClose();
    };

    const handleClose = () => {
        setSelectedModule('');
        setSelectedFunction('');
        setSelectedStore(null);
        onClose();
    };

    const availableFunctions = selectedModule ? FUNCTION_OPTIONS[selectedModule] : [];

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Adicionar Acesso">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '8px 0' }}>
                {/* Module Dropdown */}
                <div className="arbalest-form-group">
                    <label>Módulo</label>
                    <select
                        className="arbalest-input"
                        value={selectedModule}
                        onChange={(e) => {
                            setSelectedModule(e.target.value as ModuleName);
                            setSelectedFunction(''); // Reset function when module changes
                        }}
                    >
                        <option value="">Selecione o módulo...</option>
                        {MODULE_OPTIONS.map((mod) => (
                            <option key={mod.value} value={mod.value}>
                                {mod.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Function Dropdown */}
                <div className="arbalest-form-group">
                    <label>Função</label>
                    <select
                        className="arbalest-input"
                        value={selectedFunction}
                        onChange={(e) => setSelectedFunction(e.target.value)}
                        disabled={!selectedModule}
                    >
                        <option value="">Selecione a função...</option>
                        {(availableFunctions || []).map((func) => (
                            <option key={func.value} value={func.value}>
                                {func.label}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Store Dropdown */}
                <div className="arbalest-form-group">
                    <label>Loja</label>
                    <select
                        className="arbalest-input"
                        value={selectedStore === null ? 'all' : (selectedStore || '')}
                        onChange={(e) => {
                            const value = e.target.value;
                            setSelectedStore(value === 'all' ? null : (value || null));
                        }}
                    >
                        <option value="">Selecione a loja...</option>
                        <option value="all">🌐 Todas as lojas</option>
                        {stores.map((store) => (
                            <option key={store.id} value={store.id}>
                                {store.name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Actions */}
                <div className="arbalest-form-actions" style={{ marginTop: '16px' }}>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="arbalest-btn arbalest-btn-neutral"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleSave}
                        className="arbalest-btn arbalest-btn-primary"
                        disabled={!selectedModule || !selectedFunction}
                    >
                        Salvar
                    </button>
                </div>
            </div>
        </Modal>
    );
};
