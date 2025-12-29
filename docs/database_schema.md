# Arbalest Digital - Database Schema Documentation

Generated on: 2025-12-29

## Schema: `public`

| Table Name | Columns |
| :--- | :--- |
| **categories** | `id`, `name`, `color_hex`, `created_at` |
| **products** | `id`, `code`, `ean`, `name`, `supplier`, `type`, `amount`, `is_active`, `created_at`, `updated_at`, `id_category` |
| **profiles** | `id`, `role`, `store_id`, `approved_at`, `created_at`, `email`, `name` |
| **stores** | `id`, `name`, `code`, `is_active`, `created_at`, `slug` |
| **store_summary** | `id`, `name`, `code`, `is_active`, `sections_count`, `aisles_count`, `module_instances_count`, `shelf_products_count`, `slug` |

## Schema: `validity`

| Table Name | Columns |
| :--- | :--- |
| **validity_entries** | `id`, `product_id`, `store_id`, `expires_at`, `lot`, `quantity`, `status`, `created_by`, `created_at`, `updated_at`, `deleted_at`, `verified_at`, `verified_by`, `id_shelf` |
| **validity_entry_history** | `id`, `validity_entry_id`, `changed_by`, `field_name`, `old_value`, `new_value`, `created_at` |
| **validity_notifications** | `id`, `to_user_id`, `to_role`, `store_id`, `title`, `body`, `link_path`, `read_at`, `created_at` |
| **validity_delete_requests** | `id`, `validity_entry_id`, `requested_by`, `reason`, `status`, `reviewed_by`, `reviewed_at`, `created_at` |
| **solicitations** | `id`, `product_id`, `store_id`, `status`, `requested_by`, `requested_at`, `resolved_at`, `resolved_by_entry_id`, `observation` |
| **solicitations_view** | `id`, `status`, `requested_at`, `observation`, `store_id`, `product_id`, `product_name`, `product_code`, `product_ean`, `requester_id`, `requester_name` |

## Schema: `layout` (Modules & Planogram)

| Table Name | Columns |
| :--- | :--- |
| **module_patterns** | `id`, `name`, `height_cm`, `width_cm`, `depth_cm`, `default_shelves_count`, `created_at` |
| **module_instances** | `id`, `id_aisle`, `id_pattern`, `position_in_aisle`, `side`, `external_wj_id`, `created_at`, `id_sync` |
| **shelves** | `id`, `id_module`, `level`, `usable_height_mm`, `created_at` |
| **shelf_products** | `id`, `id_shelf`, `id_product`, `faces`, `pos_x_mm`, `is_stacked`, `last_synced_at`, `created_at` |
| **sections** | `id`, `id_loja`, `name`, `created_at` |
| **aisles** | `id`, `id_section`, `number`, `side_instruction`, `created_at`, `total_modules_a`, `total_modules_b` |
| **map_regions** | `id`, `id_loja`, `target_type`, `target_id`, `polygon_coords`, `created_at` |
| **import_syncs** | `id`, `id_loja`, `category_name`, `overflow_data`, `status`, `created_at` |
