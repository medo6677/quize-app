import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Question, Answer } from '../../types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import AnswerCard from './AnswerCard';
import AnimatedCounter from './AnimatedCounter';
import { MessageSquare } from 'lucide-react';

interface EssayResultsProps {
  question: Question;
}

interface GroupedAnswer extends Answer {
  isLatest: boolean;
}

export default function EssayResults({ question }: EssayResultsProps) {
  const [answers, setAnswers] = useState<GroupedAnswer[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);

  useEffect(() => {
    loadAnswers();

    // Subscribe to realtime answer changes
    const subscription = supabase
      .channel(`essay-answers-${question.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          // Add new answer to the list
          const newAnswer = payload.new as Answer;
          loadAnswers(); // Reload to properly calculate isLatest
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [question.id]);

  const loadAnswers = async () => {
    try {
      const { data: allAnswers, error } = await supabase
        .from('answers')
        .select('*')
        .eq('question_id', question.id)
        .not('text', 'is', null)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setTotalAnswers(allAnswers?.length || 0);

      // Group by student_id and mark the latest answer for each student
      const studentAnswers = new Map<string, Answer[]>();
      
      allAnswers?.forEach((answer) => {
        if (!studentAnswers.has(answer.student_id)) {
          studentAnswers.set(answer.student_id, []);
        }
        studentAnswers.get(answer.student_id)!.push(answer);
      });

      // Mark latest answer for each student
      const processedAnswers: GroupedAnswer[] = [];
      studentAnswers.forEach((studentAnswersList) => {
        // Sort by created_at descending (newest first)
        studentAnswersList.sort((a, b) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        studentAnswersList.forEach((answer, index) => {
          processedAnswers.push({
            ...answer,
            isLatest: index === 0, // First one is the latest
          });
        });
      });

      // Sort all answers: latest answers first, then older ones
      processedAnswers.sort((a, b) => {
        if (a.isLatest && !b.isLatest) return -1;
        if (!a.isLatest && b.isLatest) return 1;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });

      setAnswers(processedAnswers);
    } catch (err) {
      console.error('Error loading answers:', err);
    }
  };

  return (
    <Card className="glass-effect projector-shadow">
      <CardHeader>
        <CardTitle className="text-3xl font-bold projector-text flex items-center gap-3">
          <MessageSquare className="h-8 w-8" />
          {question.text}
        </CardTitle>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">إجمالي الإجابات:</span>
          <AnimatedCounter value={totalAnswers} className="text-2xl font-bold text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {answers.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-lg">في انتظار إجابات الطلاب...</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence mode="popLayout">
              {answers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  isLatest={answer.isLatest}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
