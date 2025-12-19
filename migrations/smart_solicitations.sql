-- Create Solicitations Table
CREATE TABLE IF NOT EXISTS validity.solicitations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL REFERENCES public.products(id),
    store_id UUID NOT NULL REFERENCES public.stores(id),
    status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'resolvido', 'arquivado')),
    requested_by UUID REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by_entry_id UUID REFERENCES validity.validity_entries(id), -- Link to the entry that resolved it
    observation TEXT
);

-- RLS Policies
ALTER TABLE validity.solicitations ENABLE ROW LEVEL SECURITY;

-- Conferentes can create requests
CREATE POLICY "conferentes_insert_solicitations"
ON validity.solicitations FOR INSERT
TO authenticated
WITH CHECK (true);

-- Everyone can view (filtered by store logic in client/server if needed, but generally open for authorized users)
CREATE POLICY "authenticated_view_solicitations"
ON validity.solicitations FOR SELECT
TO authenticated
USING (true);

-- Encarregados can update status (e.g. to archive)
CREATE POLICY "encarregados_update_solicitations"
ON validity.solicitations FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

-- Trigger Function: Auto-Resolve
CREATE OR REPLACE FUNCTION validity.auto_resolve_solicitation()
RETURNS TRIGGER AS $$
BEGIN
    -- When a new validity entry is inserted
    -- Update any PENDING solicitation for this product and store to RESOLVED
    UPDATE validity.solicitations
    SET 
        status = 'resolvido',
        resolved_at = NEW.created_at,
        resolved_by_entry_id = NEW.id
    WHERE 
        product_id = NEW.product_id 
        AND store_id = NEW.store_id
        AND status = 'pendente';
        
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger Definition
DROP TRIGGER IF EXISTS on_validity_entry_created ON validity.validity_entries;
CREATE TRIGGER on_validity_entry_created
AFTER INSERT ON validity.validity_entries
FOR EACH ROW
EXECUTE FUNCTION validity.auto_resolve_solicitation();
