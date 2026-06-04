-- ============================================================
-- SETUP ADMIN USER
-- Jalankan di Supabase Dashboard → SQL Editor
-- ============================================================

-- LANGKAH 1: Cek user yang sudah terdaftar
SELECT
  u.email,
  p.full_name,
  p.role,
  p.id
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
ORDER BY u.created_at;

-- ============================================================
-- LANGKAH 2: Jadikan user sebagai super_admin
-- Ganti 'email-anda@contoh.com' dengan email Anda yang sebenarnya
-- ============================================================

UPDATE public.profiles
SET
  role      = 'super_admin',
  full_name = COALESCE(full_name, (
    SELECT SPLIT_PART(email, '@', 1) FROM auth.users WHERE id = profiles.id
  ))
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'adminpeduatel@p2tel.or.id'  -- ← ganti dengan email Anda
  LIMIT 1
);

-- ============================================================
-- LANGKAH 3: Verifikasi (harus muncul role = super_admin)
-- ============================================================
SELECT
  u.email,
  p.full_name,
  p.role
FROM auth.users u
JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'adminpeduatel@p2tel.or.id';  -- ← ganti dengan email Anda
