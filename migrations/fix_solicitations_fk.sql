-- Fix Foreign Key for solicitations to allow PostgREST expansion with profiles
-- Originally hinted as 'requester:requested_by' but requested_by pointed to auth.users (hidden)
-- We point it to public.profiles instead.

ALTER TABLE validity.solicitations 
  DROP CONSTRAINT IF EXISTS solicitations_requested_by_fkey;

ALTER TABLE validity.solicitations
  ADD CONSTRAINT solicitations_requested_by_fkey
  FOREIGN KEY (requested_by) REFERENCES public.profiles(id);
