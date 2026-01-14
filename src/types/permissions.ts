/**
 * Sistema de Permissões por Módulo com Store Scope
 * Arquitetura: Módulos (EN) + Funções (PT-BR) + Store Scope
 */

/**
 * Funções disponíveis por módulo
 */
export const MODULE_FUNCTIONS = {
    validity: ['encarregado', 'conferente', 'visitante', 'gerente'] as const,
    butcher: ['solicitante', 'producao', 'visitante', 'gerente'] as const,
    planogram: ['editor', 'visitante'] as const,
    pharmacy: ['solicitante', 'visitante', 'gerente'] as const, // futuro
    deposit: ['gestor', 'visitante'] as const, // futuro
} as const;

export type ModuleName = keyof typeof MODULE_FUNCTIONS;

export type ValidityFunction = typeof MODULE_FUNCTIONS.validity[number];
export type ButcherFunction = typeof MODULE_FUNCTIONS.butcher[number];
export type PlanogramFunction = typeof MODULE_FUNCTIONS.planogram[number];
export type PharmacyFunction = typeof MODULE_FUNCTIONS.pharmacy[number];
export type DepositFunction = typeof MODULE_FUNCTIONS.deposit[number];

// ================================================================
// Module Access Structure
// ================================================================
// Each module access includes both the function and store scope

export interface ModuleAccess {
    function: string;              // The user's function within this module
    store_id: string | null;       // null = all stores, uuid = specific store
}

// ================================================================
// User Permissions Type
// ================================================================
// Maps module names to their access configuration

export type UserPermissions = {
    [K in ModuleName]?: ModuleAccess;
};

/**
 * Labels amigáveis para exibição na UI
 */
export const MODULE_LABELS: Record<ModuleName, string> = {
    validity: 'Gestão de Validade',
    butcher: 'Açougue',
    planogram: 'Planogramas',
    pharmacy: 'Farmácia',
    deposit: 'Depósito',
};

export const FUNCTION_LABELS: Record<string, string> = {
    // Validity
    encarregado: 'Encarregado',
    conferente: 'Conferente',

    // Butcher
    solicitante: 'Solicitante',
    producao: 'Produção',

    // Planogram
    editor: 'Editor',

    // Deposit
    gestor: 'Gestor',

    // Universal (aplicável a todos módulos)
    visitante: 'Visitante',
    gerente: 'Gerente',
};
