update public.site_content
set data = jsonb_set(data, '{hero,image_url}', '"/__l5e/assets-v1/0724bfd2-b308-4795-b72f-7850dc0d5b0d/hero-market.jpg"'::jsonb, true)
where id = 'main';