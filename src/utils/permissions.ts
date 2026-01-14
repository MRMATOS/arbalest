import type { Profile } from '../contexts/AuthContext';
import type { ModuleName } from '../types/permissions';

// ================================================================
// Core Permission Helpers
// ================================================================

/**
 * Get the store ID for a specific module
 * @returns string | null (all stores) | undefined (not configured/blocked)
 */
export function getModuleStoreId(
    user: Profile | null,
    module: ModuleName
): string | null | undefined {
    if (!user) return undefined;
    if (user.is_admin) return null; // admin sees all stores

    const access = user.permissions?.[module];
    return access?.store_id;
}

/**
 * Check if user has access to a specific store within a module
 */
export function hasStoreAccess(
    user: Profile | null,
    module: ModuleName,
    storeId: string
): boolean {
    const moduleStoreId = getModuleStoreId(user, module);

    if (moduleStoreId === undefined) return false; // not configured
    if (moduleStoreId === null) return true;        // all stores
    return moduleStoreId === storeId;               // specific store match
}

/**
 * Check if user has access to a specific module
 */
export function hasModuleAccess(
    user: Profile | null,
    module: ModuleName
): boolean {
    console.log('🔐 hasModuleAccess chamado:', {
        module,
        user: user ? {
            email: user.email,
            is_admin: user.is_admin,
            permissions: user.permissions
        } : null
    });

    if (!user) {
        console.log('❌ Acesso negado: usuário não autenticado');
        return false;
    }

    if (user.is_admin) {
        console.log('✅ Acesso concedido: usuário é admin');
        return true;
    }

    const hasAccess = !!user.permissions?.[module];
    console.log(`${hasAccess ? '✅' : '❌'} Acesso ao módulo '${module}':`, {
        hasPermission: hasAccess,
        moduleData: user.permissions?.[module]
    });

    return hasAccess;
}

/**
 * Get the function name for a module
 */
export function getModuleFunction(
    user: Profile | null,
    module: ModuleName
): string | undefined {
    if (!user || !user.permissions) return undefined;
    return user.permissions[module]?.function;
}

/**
 * Check if user has a specific function in a module
 */
export function hasFunction(
    user: Profile | null,
    module: ModuleName,
    functionName: string
): boolean {
    if (!user) return false;
    if (user.is_admin) return true;

    const access = user.permissions?.[module];
    if (!access || access.store_id === undefined) return false;

    return access.function === functionName;
}

/**
 * Check if user has any of the specified functions in a module
 */
export function hasAnyFunction(
    user: Profile | null,
    module: ModuleName,
    functionNames: string[]
): boolean {
    if (!user) return false;
    if (user.is_admin) return true;

    const access = user.permissions?.[module];
    if (!access || access.store_id === undefined) return false;

    return functionNames.includes(access.function);
}

/**
 * Get a formatted string of user's functions from permissions
 */
export function getUserFunctionsLabel(user: Profile | null): string {
    if (!user) return '';
    if (user.is_admin) return 'Admin';

    if (!user.permissions || Object.keys(user.permissions).length === 0) {
        return user.role || 'Colaborador';
    }

    // Extract unique functions
    const functions = new Set<string>();
    Object.values(user.permissions).forEach(access => {
        if (access.function) {
            functions.add(access.function);
        }
    });

    if (functions.size === 0) return user.role || 'Colaborador';

    // Capitalize and format
    const formatted = Array.from(functions).map(f =>
        f.charAt(0).toUpperCase() + f.slice(1)
    );

    return formatted.join(' / ');
}

/**
 * Get a formatted string of user's stores from permissions
 */
export function getUserStoreLabel(
    user: Profile | null,
    stores: Array<{ id: string; name: string }>
): string | null {
    if (!user) return null;
    if (user.is_admin) return null; // Admin sees all/null

    if (!user.permissions || Object.keys(user.permissions).length === 0) {
        // Fallback to legacy store if available
        return user.store?.name || null;
    }

    // Extract unique store IDs
    const storeIds = new Set<string>();
    let hasNullStore = false;

    Object.values(user.permissions).forEach(access => {
        if (access.store_id) {
            storeIds.add(access.store_id);
        } else {
            hasNullStore = true; // explicitly generic/all stores access implies hiding
        }
    });

    // If has access to "All Stores" (null) or no specific stores, return null as requested
    if (hasNullStore && storeIds.size === 0) return null;

    // If mixed (some specific, some global), usually global wins, so return null?
    // User said: "No caso de usuários que tiverem 'store_id':null, então nada deve aparecer"
    // I will assume if ANY permission has store_id: null, we hide.
    if (hasNullStore) return null;

    if (storeIds.size === 0) return null; // No stores found

    // Map IDs to Names
    const names: string[] = [];
    storeIds.forEach(id => {
        const store = stores.find(s => s.id === id);
        if (store) names.push(store.name);
    });

    if (names.length === 0) return null;

    return names.join(' / ');
}

// ================================================================
// Module-Specific Helpers
// ================================================================

export const ValidityPermissions = {
    canView: (user: Profile | null) => hasModuleAccess(user, 'validity'),

    canEdit: (user: Profile | null) =>
        hasAnyFunction(user, 'validity', ['encarregado', 'gerente']),

    canVerify: (user: Profile | null) =>
        hasAnyFunction(user, 'validity', ['conferente', 'gerente']),

    isManager: (user: Profile | null) =>
        hasFunction(user, 'validity', 'gerente'),

    getStoreId: (user: Profile | null) =>
        getModuleStoreId(user, 'validity'),
};

export const ButcherPermissions = {
    canView: (user: Profile | null) => hasModuleAccess(user, 'butcher'),

    canRequest: (user: Profile | null) =>
        hasAnyFunction(user, 'butcher', ['solicitante', 'gerente']),

    canProduce: (user: Profile | null) =>
        hasAnyFunction(user, 'butcher', ['producao', 'gerente']),

    isManager: (user: Profile | null) =>
        hasFunction(user, 'butcher', 'gerente'),

    isProducer: (user: Profile | null) =>
        hasFunction(user, 'butcher', 'producao'),

    getStoreId: (user: Profile | null) =>
        getModuleStoreId(user, 'butcher'),
};

export const PlanogramPermissions = {
    canView: (user: Profile | null) => hasModuleAccess(user, 'planogram'),

    canEdit: (user: Profile | null) =>
        hasFunction(user, 'planogram', 'editor'),

    getStoreId: (user: Profile | null) =>
        getModuleStoreId(user, 'planogram'),
};
