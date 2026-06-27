-- Firma dijital kartvizit alanları
ALTER TABLE exhibitors
  ADD COLUMN IF NOT EXISTS contact_name  text,
  ADD COLUMN IF NOT EXISTS job_title     text,
  ADD COLUMN IF NOT EXISTS linkedin_url  text;

-- Anket tabloları
CREATE TABLE IF NOT EXISTS exhibitor_surveys (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  exhibitor_id uuid NOT NULL REFERENCES exhibitors(id) ON DELETE CASCADE,
  title        text NOT NULL DEFAULT 'Anket',
  is_active    boolean DEFAULT true,
  created_at   timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS survey_questions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id     uuid NOT NULL REFERENCES exhibitor_surveys(id) ON DELETE CASCADE,
  question_text text NOT NULL,
  question_type text NOT NULL CHECK (question_type IN ('yes_no', 'multiple_choice')),
  options       text[],
  sort_order    int  DEFAULT 0,
  is_required   boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS survey_responses (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id      uuid NOT NULL REFERENCES exhibitor_surveys(id) ON DELETE CASCADE,
  question_id    uuid NOT NULL REFERENCES survey_questions(id) ON DELETE CASCADE,
  visitor_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  response_value text NOT NULL,
  created_at     timestamptz DEFAULT now(),
  UNIQUE(question_id, visitor_id)
);

-- RLS
ALTER TABLE exhibitor_surveys  ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions   ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses   ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exhibitor_surveys: owner manage"
  ON exhibitor_surveys FOR ALL USING (
    exhibitor_id IN (SELECT id FROM exhibitors WHERE owner_id = auth.uid())
  );

CREATE POLICY "exhibitor_surveys: public read"
  ON exhibitor_surveys FOR SELECT USING (true);

CREATE POLICY "survey_questions: owner manage"
  ON survey_questions FOR ALL USING (
    survey_id IN (
      SELECT s.id FROM exhibitor_surveys s
      JOIN exhibitors e ON e.id = s.exhibitor_id
      WHERE e.owner_id = auth.uid()
    )
  );

CREATE POLICY "survey_questions: public read"
  ON survey_questions FOR SELECT USING (true);

CREATE POLICY "survey_responses: visitor insert"
  ON survey_responses FOR INSERT WITH CHECK (visitor_id = auth.uid());

CREATE POLICY "survey_responses: exhibitor read"
  ON survey_responses FOR SELECT USING (
    survey_id IN (
      SELECT s.id FROM exhibitor_surveys s
      JOIN exhibitors e ON e.id = s.exhibitor_id
      WHERE e.owner_id = auth.uid()
    )
  );

CREATE POLICY "survey_responses: visitor read own"
  ON survey_responses FOR SELECT USING (visitor_id = auth.uid());
