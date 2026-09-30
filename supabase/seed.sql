-- Initial, non-personal data required by a clean Café Paraíso installation.
-- Schema, RLS policies, functions and triggers belong in supabase/migrations/.

INSERT INTO public.business_settings (
  id,
  business_name,
  cookies_banner_enabled,
  cookies_analytics_enabled,
  cookies_marketing_enabled
)
VALUES (
  '0cd5c5c5-99b9-4c3d-9eb3-7bb7d79d4209',
  'Café Paraíso',
  true,
  true,
  true
)
ON CONFLICT (id) DO UPDATE
SET business_name = EXCLUDED.business_name,
    cookies_banner_enabled = EXCLUDED.cookies_banner_enabled,
    cookies_analytics_enabled = EXCLUDED.cookies_analytics_enabled,
    cookies_marketing_enabled = EXCLUDED.cookies_marketing_enabled;

INSERT INTO public.product_categories (
  id,
  name,
  slug,
  description,
  sort_order,
  is_active
)
VALUES
  (
    'ae54c61b-5f2f-4e24-9912-3cf8d0b106d2',
    'Cafés',
    'cafes',
    'Cafés de tueste natural y mezclas.',
    10,
    true
  ),
  (
    'b2ef76f2-3b11-43f7-ad29-390e8788ef3b',
    'Infusiones',
    'infusiones',
    'Infusiones y tés para cualquier momento.',
    20,
    true
  ),
  (
    '5c96f91f-f04b-479f-a16c-8db8729cc3d8',
    'Chocolates',
    'chocolates',
    'Chocolates y cacaos seleccionados.',
    30,
    true
  ),
  (
    '7cd10f2e-9a7c-4825-9fea-442120d30179',
    'Complementos',
    'complementos',
    'Productos para acompañar una buena taza.',
    40,
    true
  )
ON CONFLICT (slug) DO UPDATE
SET name = EXCLUDED.name,
    description = EXCLUDED.description,
    sort_order = EXCLUDED.sort_order,
    is_active = EXCLUDED.is_active;

INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
VALUES
  (
    'avatars',
    'avatars',
    true,
    5242880,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
  ),
  (
    'products',
    'products',
    true,
    NULL,
    NULL
  ),
  (
    'job-applications',
    'job-applications',
    false,
    5242880,
    ARRAY[
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ]::text[]
  )
ON CONFLICT (id) DO UPDATE
SET name = EXCLUDED.name,
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;
