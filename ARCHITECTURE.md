# Arbalest Digital - Arquitetura e Convenções

> **Última atualização:** Janeiro 2026  
> **Versão do Sistema:** 2.0 (Sistema de Permissões Moderno)

Este documento define as regras, convenções e padrões arquiteturais do sistema Arbalest Digital.

---

## 📋 Índice

1. [Sistema de Permissões](#sistema-de-permissões)
2. [Estrutura de Módulos](#estrutura-de-módulos)
3. [Banco de Dados](#banco-de-dados)
4. [Convenções de Código](#convenções-de-código)
5. [Design System](#design-system)

---

## 🔐 Sistema de Permissões

### ⚠️ REGRA CRÍTICA

**NUNCA use as colunas legadas da tabela `profiles`:**
- ❌ `role` (antigo sistema de roles)
- ❌ `store_id` (store global, descontinuado)
- ❌ `butcher_role` (role específica, descontinuado)

**SEMPRE use:**
- ✅ `is_admin` (boolean) - Para verificar se é administrador
- ✅ `permissions` (JSONB) - Sistema moderno de permissões por módulo

### Estrutura de Permissões (JSONB)

```typescript
{
  "validity": {
    "function": "conferente" | "encarregado" | "visitante",
    "store_id": "uuid" | null  // null = todas as lojas
  },
  "butcher": {
    "function": "solicitante" | "producao" | "gerente" | "visitante",
    "store_id": "uuid" | null
  },
  "planogram": {
    "function": "editor" | "visitante",
    "store_id": "uuid" | null
  }
}
```

### Helpers de Permissão (`src/utils/permissions.ts`)

**Sempre use estes helpers para verificar permissões:**

```typescript
import { 
  hasModuleAccess,
  hasFunction,
  hasAnyFunction,
  getModuleStoreId,
  ValidityPermissions,
  ButcherPermissions,
  PlanogramPermissions
} from '../utils/permissions';

// ✅ CORRETO: Verificar acesso ao módulo
if (hasModuleAccess(user, 'validity')) { /* ... */ }

// ✅ CORRETO: Verificar função específica
if (ValidityPermissions.canEdit(user)) { /* ... */ }

// ❌ ERRADO: Usar colunas legadas
if (user.role === 'encarregado') { /* NÃO FAZER */ }
```

### Funções por Módulo

**Validity (Gestão de Validade)**
- `conferente` - Pode visualizar e conferir produtos
- `encarregado` - Pode editar e criar registros
- `visitante` - Apenas visualização

**Butcher (Açougue)**
- `solicitante` - Pode criar pedidos (restrito à sua loja)
- `producao` - Visualiza todos os pedidos, pode atualizar status
- `gerente` - Acesso total
- `visitante` - Apenas visualização

**Planogram (Planogramas)**
- `editor` - Pode criar e editar planogramas
- `visitante` - Apenas visualização

---

## 📦 Estrutura de Módulos

### Criando um Novo Módulo

Ao criar um novo módulo, siga este padrão:

```
src/modules/[nome-modulo]/
├── [NomeModulo]Dashboard.tsx    # Tela principal
├── components/                   # Componentes específicos
│   ├── Add[Nome]Modal.tsx
│   └── [Nome]FilterModal.tsx
└── styles/                       # Estilos se necessário
```

### Checklist de Implementação

1. **Tipos de Permissão** (`src/types/permissions.ts`)
   ```typescript
   export interface [Modulo]Access {
     function: 'funcao1' | 'funcao2';
     store_id: string | null;
   }
   
   export interface UserPermissions {
     // ... módulos existentes
     [novo_modulo]?: [Modulo]Access;
   }
   ```

2. **Helpers de Permissão** (`src/utils/permissions.ts`)
   ```typescript
   export const [Modulo]Permissions = {
     canView: (user: Profile | null) => hasModuleAccess(user, '[modulo]'),
     canEdit: (user: Profile | null) => hasAnyFunction(user, '[modulo]', ['funcao1', 'funcao2']),
     // ... outras funções
   };
   ```

3. **Route Guard** (`src/components/RouteGuards.tsx`)
   ```typescript
   <Route 
     path="/[modulo]/*" 
     element={
       <RequireModuleAccess module="[modulo]">
         <[Modulo]Dashboard />
       </RequireModuleAccess>
     } 
   />
   ```

4. **Schema do Banco de Dados**
   - Crie schema separado: `CREATE SCHEMA IF NOT EXISTS [modulo];`
   - Configure RLS baseado em `permissions` JSONB
   - **NUNCA** use `user.store_id` ou `user.role` em policies

5. **Modal de Acesso** (`src/modules/admin/AddAccessModal.tsx`)
   - Adicione o módulo em `MODULE_OPTIONS`
   - Adicione as funções em `FUNCTION_OPTIONS`

---

## 🗄️ Banco de Dados

### RLS Policies - Padrão Obrigatório

**❌ NÃO FAZER:**
```sql
-- Não usar colunas legadas
CREATE POLICY "old_policy" ON tabela
FOR SELECT USING (
  store_id IN (SELECT store_id FROM profiles WHERE id = auth.uid())
);
```

**✅ FAZER:**
```sql
CREATE POLICY "modern_policy" ON tabela
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid()
    AND (
      is_admin = true
      OR (
        permissions->'[modulo]'->>'function' IN ('funcao1', 'funcao2')
        AND (
          -- Global access
          (permissions->'[modulo]'->>'store_id' IS NULL)
          -- Specific store
          OR (permissions->'[modulo]'->>'store_id')::uuid = tabela.store_id
        )
      )
    )
  )
);
```

### Convenções de Naming

- **Schemas**: `validity`, `butcher`, `planogram` (singular, minúsculo)
- **Tabelas**: `entries`, `orders`, `patterns` (plural, minúsculo)
- **Colunas**: `snake_case`
- **Policies**: `[schema]_[action]_policy` (ex: `butcher_read_policy`)

### ⚠️ Schemas e Tabelas por Módulo

**IMPORTANTE:** Use `.schema()` + `.from()` separadamente para schemas customizados.

#### Schema `public` (Compartilhado)
- `profiles` - Perfis de usuário com permissões
- `stores` - Lojas do sistema
- `products` - Catálogo de produtos

#### Schema `validity`
- `entries` - Registros de validade de produtos
- `entry_history` - Histórico de alterações
- `delete_requests` - Solicitações de exclusão

#### Schema `butcher` 
**⚠️ ATENÇÃO: Schema reorganizado em lote/itens**

✅ **Tabelas Corretas:**
- `order_batches` - Cabeçalho do pedido (lote)
- `order_items` - Itens individuais do pedido (linhas)

❌ **NÃO EXISTE:**
- `orders` - Tabela antiga, removida

**Uso Correto com Supabase:**
```typescript
// ✅ CORRETO - Usar .schema() + .from() separadamente
const { data } = await supabase
  .schema('butcher')
  .from('order_batches')
  .select('*');

const { data: items } = await supabase
  .schema('butcher')
  .from('order_items')
  .select('*');

// ❌ ERRADO - NÃO usar ponto no nome da tabela
const { data } = await supabase
  .from('butcher.order_batches'); // Cria public.butcher.order_batches!

// ❌ ERRADO - NÃO usar apenas .from() sem declarar schema
const { data } = await supabase
  .from('order_batches'); // Procura em public.order_batches
```

**Por que usar `.schema()` separadamente?**
- Usar `.from('butcher.order_batches')` faz o Supabase interpretar `butcher.order_batches` como nome de tabela no schema `public`
- Resultado: busca em `public.butcher.order_batches` (não existe)
- Solução: `.schema('butcher').from('order_batches')` especifica schema E tabela corretamente

**Realtime Subscriptions:**
```typescript
// ✅ CORRETO - Especificar schema e table separadamente
supabase.channel('butcher_updates')
  .on('postgres_changes',
    { event: '*', schema: 'butcher', table: 'order_batches' },
    () => fetchOrders()
  )
  .subscribe();
```

---


## 💻 Convenções de Código

### TypeScript

```typescript
// ✅ Use tipos explícitos
const handleSave = async (data: FormData): Promise<void> => { /* ... */ }

// ✅ Use interfaces para objetos complexos
interface ValidityEntry {
  id: string;
  product_id: string;
  // ...
}

// ✅ Imports organizados
import React, { useEffect, useState } from 'react';  // React
import { supabase } from '../../services/supabase';  // Services
import { useAuth } from '../../contexts/AuthContext'; // Contexts
import { ValidityPermissions } from '../../utils/permissions'; // Utils
import { DashboardLayout } from '../../layouts/DashboardLayout'; // Layouts
```

### Componentes React

```typescript
// ✅ Functional Components com TypeScript
export const ComponentName: React.FC<Props> = ({ prop1, prop2 }) => {
  // Hooks primeiro
  const { user } = useAuth();
  const [state, setState] = useState();
  
  useEffect(() => { /* ... */ }, []);
  
  // Funções auxiliares
  const handleAction = () => { /* ... */ };
  
  // Guard clauses
  if (loading) return <LoadingSpinner />;
  if (!user) return null;
  
  // JSX principal
  return (
    <DashboardLayout>
      {/* ... */}
    </DashboardLayout>
  );
};
```

### Queries Supabase

```typescript
// ✅ Use o helper getModuleStoreId para obter o store_id
const storeId = getModuleStoreId(user, 'validity');

// ✅ Queries condicionais baseadas em permissões
let query = supabase.from('validity.entries').select('*');

if (storeId !== null) {
  query = query.eq('store_id', storeId);
}
// Se storeId === null, usuário vê todas as lojas

const { data } = await query;
```

---

## 🎨 Design System

### Classes CSS (Global)

**Botões:**
- `arbalest-btn` - Base
- `arbalest-btn-primary` - Ação principal (verde)
- `arbalest-btn-danger` - Ação destrutiva (vermelho)
- `arbalest-btn-neutral` - Ação neutra (cinza)
- `arbalest-btn-outline` - Outline
- `arbalest-icon-btn` - Botão com ícone apenas

**Forms:**
- `arbalest-form`
- `arbalest-form-group`
- `arbalest-input`
- `arbalest-select`
- `arbalest-checkbox-label`

**Layout:**
- `arbalest-card` - Card com glassmorphism
- `arbalest-glass` - Efeito glass
- `arbalest-modal-overlay` - Overlay de modal
- `arbalest-modal` - Container do modal

### Variáveis CSS

```css
:root {
  /* Colors */
  --brand-primary: #16a34a;     /* Verde principal */
  --brand-primary-rgb: 22, 163, 74;
  --success: #16a34a;
  --warning: #f59e0b;
  --danger: #dc2626;
  
  /* Text */
  --text-primary: #ffffff;
  --text-secondary: #a1a1aa;
  --text-tertiary: #52525b;
  
  /* Background */
  --background: #09090b;
  --surface: #18181b;
  --surface-secondary: #27272a;
  
  /* Border */
  --border-color: rgba(255, 255, 255, 0.1);
}
```

---

## 📝 Edge Functions

### Convenções

- **Linguagem:** TypeScript (Deno)
- **Runtime:** Deno
- **Localização:** `supabase/functions/[nome-funcao]/index.ts`

### Template Base

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: req.headers.get('Authorization')! } } }
    );

    // Verify User is Admin
    const { data: { user } } = await supabaseClient.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { data: profile } = await supabaseClient
      .from('profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (!profile?.is_admin) {
      throw new Error('Forbidden: Only Admins allowed');
    }

    // Lógica da função aqui

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
    );
  }
});
```

---

## 🚀 Deploy e Versionamento

### Git Workflow

1. Sempre commit com mensagens descritivas em português
2. Use prefixos: `feat:`, `fix:`, `refactor:`, `docs:`
3. Faça push antes de deploy

### Deploy Vercel

```bash
npx vercel --prod
```

### Deploy Edge Functions

```bash
# Via MCP (recomendado - usado pela IA)
# Ou via CLI:
supabase functions deploy [nome-funcao]
```

---

## ⚡ Performance

### Queries

- Use `.select()` específico, não `select('*')` quando desnecessário
- Implemente paginação para listas grandes
- Use realtime subscriptions apenas quando necessário

### Frontend

- Lazy load de imagens
- Code splitting por rota (já implementado com React Router)
- Minimize re-renders com `React.memo` quando apropriado

---

## 🔒 Segurança

### Checklist de Segurança por Módulo

- [ ] RLS habilitado em todas as tabelas
- [ ] Policies verificam `is_admin` OR `permissions` JSONB
- [ ] Edge Functions verificam autenticação
- [ ] Inputs sanitizados no frontend
- [ ] SQL injection prevenido (use Supabase client, não raw SQL no frontend)
- [ ] XSS prevenido (React escapa automaticamente)

---

## 📞 Suporte e Manutenção

### Logs e Debug

- Console logs devem usar emojis para fácil identificação:
  - `🗄️` - Database operations
  - `✅` - Success
  - `❌` - Errors
  - `📥` - Data received
  - `💾` - Saving data

### Contato

Para dúvidas sobre a arquitetura, consulte este documento primeiro.
Mantenha este arquivo atualizado conforme o sistema evolui.

---

**Última revisão:** 14 de Janeiro de 2026  
**Responsável:** Equipe de Desenvolvimento Arbalest Digital
