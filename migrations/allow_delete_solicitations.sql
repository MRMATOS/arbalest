-- Enable RLS just in case (it likely is already)
ALTER TABLE validity.solicitations ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists to avoid conflicts (optional but safer for re-runs)
DROP POLICY IF EXISTS "Users can delete their own pending solicitations" ON validity.solicitations;

-- Create the policy
CREATE POLICY "Users can delete their own pending solicitations"
ON validity.solicitations
FOR DELETE
TO authenticated
USING (
  requested_by = auth.uid() 
  AND status = 'pendente'
);
