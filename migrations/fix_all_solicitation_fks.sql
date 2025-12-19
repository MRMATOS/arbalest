-- Recreate Foreign Keys with Explicit Names for PostgREST resolution
-- Cross-schema relationships sometimes fail automatic resolution.

-- 1. Product FK
ALTER TABLE validity.solicitations 
  DROP CONSTRAINT IF EXISTS solicitations_product_id_fkey;

ALTER TABLE validity.solicitations
  ADD CONSTRAINT solicitations_product_fkey
  FOREIGN KEY (product_id) REFERENCES public.products(id);

-- 2. Store FK (Good practice to explicit naming)
ALTER TABLE validity.solicitations 
  DROP CONSTRAINT IF EXISTS solicitations_store_id_fkey;

ALTER TABLE validity.solicitations
  ADD CONSTRAINT solicitations_store_fkey
  FOREIGN KEY (store_id) REFERENCES public.stores(id);

-- 3. ensure requester FK is also clearly named (we did this partially before, reinforcing)
ALTER TABLE validity.solicitations 
  DROP CONSTRAINT IF EXISTS solicitations_requested_by_fkey;

ALTER TABLE validity.solicitations
  ADD CONSTRAINT solicitations_requester_fkey -- Renaming to 'requester' to match our prop intent if desired, or just simple
  FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
