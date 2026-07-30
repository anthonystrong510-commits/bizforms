
CREATE TYPE public.app_role AS ENUM ('admin','user');

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile read" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "read own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE first_user boolean;
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name'), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;

  SELECT NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') INTO first_user;
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, CASE WHEN first_user THEN 'admin'::public.app_role ELSE 'user'::public.app_role END)
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TABLE public.forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL DEFAULT 'Untitled form',
  description text NOT NULL DEFAULT '',
  cover_image_url text,
  theme text NOT NULL DEFAULT 'crimson',
  slug text NOT NULL UNIQUE,
  short_code text NOT NULL UNIQUE,
  is_published boolean NOT NULL DEFAULT false,
  accepting_responses boolean NOT NULL DEFAULT true,
  confirmation_message text NOT NULL DEFAULT 'Thanks! Your response has been recorded.',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.forms TO authenticated;
GRANT SELECT ON public.forms TO anon;
GRANT ALL ON public.forms TO service_role;
ALTER TABLE public.forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published forms are public" ON public.forms FOR SELECT TO anon, authenticated USING (is_published = true);
CREATE POLICY "admins read all forms" ON public.forms FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins insert forms" ON public.forms FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') AND owner_id = auth.uid());
CREATE POLICY "admins update forms" ON public.forms FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins delete forms" ON public.forms FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'short_text',
  title text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  required boolean NOT NULL DEFAULT false,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT SELECT ON public.questions TO anon;
GRANT ALL ON public.questions TO service_role;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "questions of published forms are public" ON public.questions FOR SELECT TO anon, authenticated
  USING (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.is_published));
CREATE POLICY "admins read questions" ON public.questions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admins write questions" ON public.questions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id uuid NOT NULL REFERENCES public.forms(id) ON DELETE CASCADE,
  submitted_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.responses TO authenticated;
GRANT INSERT ON public.responses TO anon, authenticated;
GRANT ALL ON public.responses TO service_role;
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit response" ON public.responses FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.forms f WHERE f.id = form_id AND f.is_published AND f.accepting_responses));
CREATE POLICY "admins read responses" ON public.responses FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.answers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id uuid NOT NULL REFERENCES public.responses(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  value jsonb NOT NULL DEFAULT '""'::jsonb
);
GRANT SELECT ON public.answers TO authenticated;
GRANT INSERT ON public.answers TO anon, authenticated;
GRANT ALL ON public.answers TO service_role;
ALTER TABLE public.answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can insert answers" ON public.answers FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.responses r JOIN public.forms f ON f.id = r.form_id
    WHERE r.id = response_id AND f.is_published AND f.accepting_responses));
CREATE POLICY "admins read answers" ON public.answers FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.touch_updated_at() RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER forms_touch BEFORE UPDATE ON public.forms FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE INDEX idx_questions_form ON public.questions(form_id, position);
CREATE INDEX idx_responses_form ON public.responses(form_id);
CREATE INDEX idx_answers_response ON public.answers(response_id);
