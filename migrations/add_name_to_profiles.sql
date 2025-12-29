-- Migration: add_name_to_profiles
-- Description: Adds a name column to the profiles table for display names
-- Date: 2025-12-19

-- Add name column to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS name TEXT;

-- Add a comment to describe the column
COMMENT ON COLUMN public.profiles.name IS 'User display name shown in the UI';
