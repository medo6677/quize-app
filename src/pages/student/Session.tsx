import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { getStudentId } from '../../lib/auth';
import type { QuestionWithOptions } from '../../types/database.types';
import MCQQuestion from '../../components/student/MCQQuestion';
import EssayQuestion from '../../components/student/EssayQuestion';
import { Skeleton } from '../../components/ui/skeleton';
import { Card, CardContent } from '../../components/ui/card';
import { AlertCircle } from 'lucide-react';

export default function SessionPage() {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [activeQuestion, setActiveQuestion] = useState<QuestionWithOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const studentId = getStudentId();

  useEffect(() => {
    if (!code) {
      navigate('/join');
      return;
    }

    // Get session by code
    const fetchSession = async () => {
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        setError('Session not found or inactive');
        setLoading(false);
        return;
      }
      
      // Get active question
      await fetchActiveQuestion(session.id);
      setLoading(false);
    };

    fetchSession();

    // Subscribe to question changes
    const subscription = supabase
      .channel('questions-channel')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
        },
        async (payload: any) => {
          if (payload.new && payload.new.is_active) {
            await fetchActiveQuestion(payload.new.session_id);
          } else if (payload.eventType === 'UPDATE' && !payload.new.is_active) {
            // Question was deactivated
            if (activeQuestion?.id === payload.new.id) {
              setActiveQuestion(null);
            }
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [code, navigate]);

  const fetchActiveQuestion = async (sessionId: string) => {
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('session_id', sessionId)
      .eq('is_active', true)
      .single();

    if (questionError || !question) {
      setActiveQuestion(null);
      return;
    }

    // If MCQ, fetch options
    if (question.type === 'mcq') {
      const { data: options } = await supabase
        .from('options')
        .select('*')
        .eq('question_id', question.id)
        .order('position');

      setActiveQuestion({
        ...question,
        options: options || [],
      });
    } else {
      setActiveQuestion({
        ...question,
        options: [],
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="p-8 space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-12 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="w-full max-w-md border-destructive">
            <CardContent className="p-8 text-center space-y-4">
              <AlertCircle className="w-16 h-16 text-destructive mx-auto" />
              <h2 className="text-2xl font-bold">{error}</h2>
              <button
                onClick={() => navigate('/join')}
                className="text-primary hover:underline"
              >
                Go back
              </button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-3xl">
        {!activeQuestion ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <Card className="glass-effect projector-shadow">
              <CardContent className="p-12 text-center space-y-4">
                <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto">
                  <div className="w-3 h-3 bg-primary rounded-full animate-pulse" />
                </div>
                <h2 className="text-2xl font-semibold text-muted-foreground">
                  في انتظار السؤال...
                </h2>
                <p className="text-sm text-muted-foreground">
                  سيقوم المعلم بتفعيل السؤال قريباً
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ) : activeQuestion.type === 'mcq' ? (
          <MCQQuestion
            question={activeQuestion}
            studentId={studentId}
            onSubmitted={() => {}}
          />
        ) : (
          <EssayQuestion
            question={activeQuestion}
            studentId={studentId}
            onSubmitted={() => {}}
          />
        )}
      </div>
    </div>
  );
}
