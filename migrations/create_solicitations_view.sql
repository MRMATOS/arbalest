-- Create a View to simplify Solicitations fetching and avoid Cross-Schema Join issues in PostgREST
CREATE OR REPLACE VIEW validity.solicitations_view AS
SELECT 
    s.id,
    s.status,
    s.created_at, -- or requested_at check schema
    s.requested_at,
    s.observation,
    s.store_id,
    -- Product Details
    p.id as product_id,
    p.name as product_name,
    p.code as product_code,
    p.ean as product_ean,
    -- Requester Details
    pr.id as requester_id,
    pr.email as requester_name
FROM 
    validity.solicitations s
JOIN 
    public.products p ON s.product_id = p.id
LEFT JOIN 
    public.profiles pr ON s.requested_by = pr.id;

-- Grant Permissions
GRANT SELECT ON validity.solicitations_view TO authenticated;
