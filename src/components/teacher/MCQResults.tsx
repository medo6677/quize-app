import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { QuestionWithOptions } from '../../types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import AnimatedCounter from './AnimatedCounter';
import { Users } from 'lucide-react';

interface MCQResultsProps {
  question: QuestionWithOptions;
}

interface OptionCount {
  id: string;
  text: string;
  count: number;
  percentage: number;
}

const BAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-yellow-500',
  'bg-red-500',
  'bg-purple-500',
  'bg-cyan-500',
];

export default function MCQResults({ question }: MCQResultsProps) {
  const [optionCounts, setOptionCounts] = useState<OptionCount[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);

  useEffect(() => {
    loadAnswers();

    // Subscribe to realtime answer changes
    const subscription = supabase
      .channel(`mcq-answers-${question.id}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        () => {
          loadAnswers();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [question.id]);

  const loadAnswers = async () => {
    try {
      const { data: answers, error } = await supabase
        .from('answers')
        .select('option_id')
        .eq('question_id', question.id)
        .not('option_id', 'is', null);

      if (error) throw error;

      const total = answers?.length || 0;
      setTotalAnswers(total);

      // Count answers per option
      const counts = question.options.map((option) => {
        const count = answers?.filter((a) => a.option_id === option.id).length || 0;
        return {
          id: option.id,
          text: option.text,
          count,
          percentage: total > 0 ? Math.round((count / total) * 100) : 0,
        };
      });

      setOptionCounts(counts);
    } catch (err) {
      console.error('Error loading answers:', err);
    }
  };

  return (
    <Card className="glass-effect projector-shadow">
      <CardHeader>
        <CardTitle className="text-3xl font-bold projector-text flex items-center gap-3">
          <Users className="h-8 w-8" />
          {question.text}
        </CardTitle>
        <div className="flex items-center gap-2 mt-4">
          <span className="text-sm text-muted-foreground">إجمالي الإجابات:</span>
          <AnimatedCounter value={totalAnswers} className="text-2xl font-bold text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        {/* Simple Bar Display */}
        <div className="space-y-6">
          <AnimatePresence>
            {optionCounts.map((option, index) => (
              <motion.div
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="space-y-2"
              >
                {/* Option Label */}
                <div className="flex justify-between items-center">
                  <p className="font-semibold text-lg projector-text">{option.text}</p>
                  <span className="text-sm text-muted-foreground">{option.percentage}%</span>
                </div>

                {/* Bar with Count */}
                <div className="relative">
                  {/* Background track */}
                  <div className="w-full h-16 bg-secondary/50 rounded-lg overflow-hidden border border-white/5">
                    {/* Animated bar */}
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${option.percentage}%` }}
                      transition={{ duration: 0.8, ease: 'easeOut' }}
                      className={`h-full ${BAR_COLORS[index % BAR_COLORS.length]} flex items-center justify-center relative shadow-lg`}
                    >
                      {/* Count displayed on bar */}
                      <div className="absolute inset-0 flex items-center justify-center">
                        <AnimatedCounter
                          value={option.count}
                          className="text-2xl font-bold text-white drop-shadow-md"
                        />
                      </div>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </CardContent>
    </Card>
  );
}
