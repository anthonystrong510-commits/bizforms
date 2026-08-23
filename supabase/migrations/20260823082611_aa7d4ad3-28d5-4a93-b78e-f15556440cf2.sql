CREATE TABLE public.attendees (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
  email text not null,
  created_at timestamptz not null default now()
);
CREATE UNIQUE INDEX attendees_email_key ON public.attendees (lower(email));
GRANT INSERT ON public.attendees TO anon, authenticated;
GRANT SELECT ON public.attendees TO authenticated;
GRANT ALL ON public.attendees TO service_role;
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can join guest list" ON public.attendees FOR INSERT TO anon, authenticated WITH CHECK (char_length(email) between 3 and 255 AND char_length(name) <= 120);
CREATE POLICY "admins read attendees" ON public.attendees FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));