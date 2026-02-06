-- Real-Time Classroom Interaction Platform Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Sessions table
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code TEXT UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  teacher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Questions table
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
  type TEXT CHECK (type IN ('mcq', 'essay')) NOT NULL,
  text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Options table (for MCQ questions only)
CREATE TABLE options (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  text TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Answers table (append-only, never update)
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id UUID REFERENCES questions(id) ON DELETE CASCADE NOT NULL,
  student_id TEXT NOT NULL, -- anonymous UUID from localStorage
  option_id UUID REFERENCES options(id) ON DELETE SET NULL,
  text TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for performance
CREATE INDEX idx_sessions_code ON sessions(code);
CREATE INDEX idx_sessions_teacher ON sessions(teacher_id);
CREATE INDEX idx_questions_session ON questions(session_id);
CREATE INDEX idx_questions_active ON questions(is_active) WHERE is_active = true;
CREATE INDEX idx_options_question ON options(question_id);
CREATE INDEX idx_answers_question ON answers(question_id);
CREATE INDEX idx_answers_student ON answers(student_id);
CREATE INDEX idx_answers_created ON answers(created_at DESC);

-- Enable Row Level Security on all tables
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE options ENABLE ROW LEVEL SECURITY;
ALTER TABLE answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for sessions
CREATE POLICY "Teachers can view their own sessions"
  ON sessions FOR SELECT
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can insert their own sessions"
  ON sessions FOR INSERT
  WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers can update their own sessions"
  ON sessions FOR UPDATE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers can delete their own sessions"
  ON sessions FOR DELETE
  USING (auth.uid() = teacher_id);

CREATE POLICY "Public can view active sessions by code"
  ON sessions FOR SELECT
  USING (is_active = true);

-- RLS Policies for questions
CREATE POLICY "Teachers can view questions in their sessions"
  ON questions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert questions in their sessions"
  ON questions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update questions in their sessions"
  ON questions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete questions in their sessions"
  ON questions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Public can view active questions in active sessions"
  ON questions FOR SELECT
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM sessions
      WHERE sessions.id = questions.session_id
      AND sessions.is_active = true
    )
  );

-- RLS Policies for options
CREATE POLICY "Teachers can view options for their questions"
  ON options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = options.question_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can insert options for their questions"
  ON options FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = options.question_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can update options for their questions"
  ON options FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = options.question_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Teachers can delete options for their questions"
  ON options FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = options.question_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Public can view options for active questions"
  ON options FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = options.question_id
      AND questions.is_active = true
      AND sessions.is_active = true
    )
  );

-- RLS Policies for answers
CREATE POLICY "Teachers can view answers for their questions"
  ON answers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM questions
      JOIN sessions ON sessions.id = questions.session_id
      WHERE questions.id = answers.question_id
      AND sessions.teacher_id = auth.uid()
    )
  );

CREATE POLICY "Anyone can insert answers"
  ON answers FOR INSERT
  WITH CHECK (true);

-- Prevent updates and deletes on answers (append-only)
-- No UPDATE or DELETE policies = no one can update or delete

-- Function to deactivate other questions when activating a new one
CREATE OR REPLACE FUNCTION deactivate_other_questions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_active = true THEN
    UPDATE questions
    SET is_active = false
    WHERE session_id = NEW.session_id
    AND id != NEW.id
    AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to ensure only one active question per session
CREATE TRIGGER ensure_single_active_question
  BEFORE INSERT OR UPDATE ON questions
  FOR EACH ROW
  WHEN (NEW.is_active = true)
  EXECUTE FUNCTION deactivate_other_questions();

-- Enable realtime for answers table (this is where the magic happens!)
ALTER PUBLICATION supabase_realtime ADD TABLE answers;

-- Optional: Enable realtime for questions table (for when teacher activates a question)
ALTER PUBLICATION supabase_realtime ADD TABLE questions;

-- Function to generate unique session code
CREATE OR REPLACE FUNCTION generate_session_code()
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 6-digit code
    new_code := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    
    -- Check if code already exists
    SELECT EXISTS(SELECT 1 FROM sessions WHERE sessions.code = new_code) INTO code_exists;
    
    -- If doesn't exist, return it
    IF NOT code_exists THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
