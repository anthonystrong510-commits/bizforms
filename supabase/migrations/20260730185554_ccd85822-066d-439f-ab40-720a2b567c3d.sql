
ALTER TABLE public.forms
  ADD COLUMN IF NOT EXISTS sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS background_image_url text,
  ADD COLUMN IF NOT EXISTS background_dim numeric NOT NULL DEFAULT 0.55;

ALTER TABLE public.questions
  ADD COLUMN IF NOT EXISTS section integer NOT NULL DEFAULT 0;

ALTER TABLE public.responses
  ADD COLUMN IF NOT EXISTS seq integer;

WITH numbered AS (
  SELECT id, row_number() OVER (PARTITION BY form_id ORDER BY submitted_at) AS rn
  FROM public.responses
)
UPDATE public.responses r SET seq = n.rn FROM numbered n WHERE n.id = r.id AND r.seq IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS responses_form_seq_idx ON public.responses(form_id, seq);

CREATE OR REPLACE FUNCTION public.submit_response(p_form_id uuid, p_answers jsonb)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_ok boolean;
  v_seq integer;
  v_response_id uuid;
  v_item jsonb;
BEGIN
  SELECT (is_published AND accepting_responses) INTO v_ok FROM public.forms WHERE id = p_form_id;
  IF v_ok IS NULL THEN
    RAISE EXCEPTION 'Form not found';
  END IF;
  IF NOT v_ok THEN
    RAISE EXCEPTION 'This form is not currently accepting responses';
  END IF;

  SELECT COALESCE(MAX(seq), 0) + 1 INTO v_seq FROM public.responses WHERE form_id = p_form_id;

  INSERT INTO public.responses (form_id, seq) VALUES (p_form_id, v_seq)
  RETURNING id INTO v_response_id;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_answers)
  LOOP
    INSERT INTO public.answers (response_id, question_id, value)
    SELECT v_response_id, (v_item->>'question_id')::uuid, v_item->'value'
    WHERE EXISTS (
      SELECT 1 FROM public.questions q
      WHERE q.id = (v_item->>'question_id')::uuid AND q.form_id = p_form_id
    );
  END LOOP;

  RETURN v_seq;
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_response(uuid, jsonb) TO anon, authenticated;
