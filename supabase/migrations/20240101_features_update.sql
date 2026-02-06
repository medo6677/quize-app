-- Add is_hidden column if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'answers' AND column_name = 'is_hidden') THEN
        ALTER TABLE "answers" ADD COLUMN "is_hidden" BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Create function to check rate limit
CREATE OR REPLACE FUNCTION check_answer_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
    last_submission_time TIMESTAMP WITH TIME ZONE;
BEGIN
    -- Check for last submission by this student for this question
    SELECT created_at INTO last_submission_time
    FROM answers
    WHERE student_id = NEW.student_id 
    AND question_id = NEW.question_id
    ORDER BY created_at DESC
    LIMIT 1;

    -- If a submission exists and it's less than 3 seconds ago
    IF last_submission_time IS NOT NULL AND (NOW() - last_submission_time) < INTERVAL '3 seconds' THEN
        RAISE EXCEPTION 'Rate limit exceeded. Please wait 3 seconds between submissions.';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if exists to ensure clean slate
DROP TRIGGER IF EXISTS check_rate_limit_trigger ON answers;

-- Create trigger
CREATE TRIGGER check_rate_limit_trigger
BEFORE INSERT ON answers
FOR EACH ROW
EXECUTE FUNCTION check_answer_rate_limit();
