-- ============================================================
-- Add Admin Approval Fields to Profiles Table
-- Enables admin registration with superadmin approval workflow
-- ============================================================

-- Add approval tracking fields to profiles table
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_approved BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS registered_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

-- Create index for pending approvals query performance
CREATE INDEX IF NOT EXISTS idx_profiles_pending_approval
  ON public.profiles(is_approved, role)
  WHERE is_approved = false AND role = 'admin';

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.is_approved IS 'Whether admin user has been approved by superadmin';
COMMENT ON COLUMN public.profiles.registered_at IS 'Timestamp of registration';
COMMENT ON COLUMN public.profiles.approved_at IS 'Timestamp of superadmin approval';
COMMENT ON COLUMN public.profiles.approved_by IS 'UUID of superadmin who approved this user';
