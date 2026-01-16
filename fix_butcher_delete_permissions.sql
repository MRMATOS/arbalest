-- ================================================================
-- CORREÇÃO DE PERMISSÕES DE EXCLUSÃO (AÇOUGUE)
-- ================================================================
-- Este script permite que usuários da mesma loja excluam "Rasunhos" (drafts)
-- uns dos outros, além de permitir que Admins excluam qualquer pedido.

-- 1. Habilitar RLS (segurança por linha)
ALTER TABLE butcher.order_batches ENABLE ROW LEVEL SECURITY;

-- 2. Remover políticas antigas/conflitantes de exclusão
DROP POLICY IF EXISTS "Enable delete for users of same store" ON butcher.order_batches;
DROP POLICY IF EXISTS "Delete orders" ON butcher.order_batches;
DROP POLICY IF EXISTS "Enable delete for order owner" ON butcher.order_batches;

-- 3. Criar a nova regra de permissão
CREATE POLICY "Enable delete for users of same store"
ON butcher.order_batches
FOR DELETE
USING (
  (
    -- CASO 1: Usuário é Admin
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_admin = true
    )
  )
  OR
  (
    -- CASO 2: Pedido é Rascunho E Usuário pertence à mesma loja
    status = 'draft' AND
    requester_store_id::text = (
      SELECT permissions->'butcher'->>'store_id'
      FROM public.profiles
      WHERE id = auth.uid()
    )
  )
);

-- Confirmação
SELECT 'Permissões atualizadas com sucesso!' as result;
