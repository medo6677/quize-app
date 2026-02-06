import { useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Question } from '../../types/database.types';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Check, Loader2 } from 'lucide-react';

interface EssayQuestionProps {
  question: Question;
  studentId: string;
  onSubmitted: () => void;
}

export default function EssayQuestion({ question, studentId, onSubmitted }: EssayQuestionProps) {
  const [answer, setAnswer] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setLoading(true);

    try {
      const { error } = await supabase.from('answers').insert({
        question_id: question.id,
        student_id: studentId,
        text: answer.trim(),
      } as any);

      if (error) throw error;

      // Broadcast the new answer to bypass RLS delays
      await supabase.channel(`question-${question.id}`).send({
        type: 'broadcast',
        event: 'new-answer',
        payload: {
          question_id: question.id,
          student_id: studentId,
          text: answer.trim(),
          created_at: new Date().toISOString(), // Simulate created_at for sorting
        },
      });

      setSubmitted(true);
      setAnswer('');
      
      setTimeout(() => {
        setSubmitted(false);
        onSubmitted();
      }, 2000);
    } catch (err) {
      console.error('Error submitting answer:', err);
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200 }}
      >
        <Card className="glass-effect projector-shadow">
          <CardContent className="p-12 text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center mx-auto"
            >
              <Check className="w-10 h-10 text-white" />
            </motion.div>
            <h2 className="text-3xl font-bold text-green-500 projector-text">
              تم إرسال الحل!
            </h2>
            <p className="text-lg text-muted-foreground">
              شكراً لإجابتك
            </p>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="glass-effect projector-shadow">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl md:text-3xl font-bold projector-text">
            {question.text}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="اكتب إجابتك هنا..."
              className="min-h-[150px] md:min-h-[200px] text-base md:text-lg resize-none"
              autoFocus
            />
            <div className="mt-2 text-right text-xs md:text-sm text-muted-foreground">
              {answer.length} حرف
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={!answer.trim() || loading}
              className="w-full h-12 md:h-14 text-lg md:text-xl font-semibold"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                  جاري الإرسال...
                </>
              ) : (
                'إرسال الإجابة'
              )}
            </Button>
          </motion.div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
