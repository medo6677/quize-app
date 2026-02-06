import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { QuestionWithOptions } from '../../types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import AnimatedCounter from './AnimatedCounter';
import { Users, BarChart3, Grid } from 'lucide-react';
import { Button } from '../ui/button';

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
  const [viewMode, setViewMode] = useState<'bar' | 'heatmap'>('bar');

  useEffect(() => {
    loadAnswers();

    // Must match the channel name the student is broadcasting to
    const channelId = `question-${question.id}`;

    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
          handleNewAnswer(payload.new);
        }
      )
      .on(
        'broadcast',
        { event: 'new-answer' },
        (payload) => {
           // Verify it's for this question (though channel is unique enough usually, but harmless to check)
           if (payload.payload.question_id === question.id) {
               console.log('⚡ Received BROADCAST answer');
               
               // If we received a broadcast, we can use the payload options directly
               // The broadcast payload has { options: string[], ... }
               // We need to construct a partial answer object or just handle the increment logic
               // Let's use the helper logic
               const newOptionIds = payload.payload.options as string[];
               
               setTotalAnswers((prev) => prev + 1);
             
               setOptionCounts((prevCounts) => {
                  return prevCounts.map(opt => {
                     let newCount = opt.count;
                     if (newOptionIds.includes(opt.id)) {
                        newCount++;
                     }
                     return {
                        ...opt,
                        count: newCount,
                        percentage: 0 // Will be recalculated in a simpler way if needed, or by the state update logic
                     };
                  });
               });
               
               // Re-calculate percentages cleanly
               setOptionCounts(prev => {
                  const total = prev.reduce((sum, item) => sum + item.count, 0);
                  return prev.map(p => ({
                     ...p,
                     percentage: total > 0 ? Math.round((p.count / total) * 100) : 0
                  }));
               });
           }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [question.id]);

  const handleNewAnswer = (newAnswer: any) => {
      // Optimistically update state to avoid cache issues
      setTotalAnswers((prev) => {
         const newTotal = prev + 1;
         
         setOptionCounts((prevCounts) => {
            return prevCounts.map(opt => {
               let newCount = opt.count;
               if (opt.id === newAnswer.option_id) {
                  newCount++;
               }
               return {
                  ...opt,
                  count: newCount,
                  percentage: Math.round((newCount / newTotal) * 100)
               };
            });
         });

         return newTotal;
      });
  };

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
    <Card className="glass-effect projector-shadow overflow-hidden">
      <CardHeader className="flex flex-col-reverse sm:flex-row items-stretch sm:items-start justify-between gap-4 pb-2">
        <div className="space-y-2 text-center sm:text-right flex-1 min-w-0">
            <CardTitle className="text-2xl sm:text-3xl font-bold projector-text flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 leading-tight" dir="auto">
            <Users className="h-6 w-6 sm:h-8 sm:w-8 shrink-0 text-muted-foreground sm:mt-1" />
            <span className="break-words">{question.text}</span>
            </CardTitle>
            <div className="flex items-center justify-center sm:justify-start gap-2">
            <span className="text-xs sm:text-sm text-muted-foreground">إجمالي الإجابات:</span>
            <AnimatedCounter value={totalAnswers} className="text-xl sm:text-2xl font-bold text-primary" />
            </div>
        </div>
        
        <div className="flex justify-center sm:justify-end">
          <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg w-full sm:w-auto overflow-x-auto">
              <Button
                  variant={viewMode === 'bar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('bar')}
                  className="gap-2 flex-1 sm:flex-none h-8 sm:h-9"
              >
                  <BarChart3 className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">أعمدة</span>
              </Button>
              <Button
                  variant={viewMode === 'heatmap' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('heatmap')}
                  className="gap-2 flex-1 sm:flex-none h-8 sm:h-9"
              >
                  <Grid className="h-4 w-4" />
                  <span className="text-xs sm:text-sm">خريطة</span>
              </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <AnimatePresence mode="wait">
            {viewMode === 'bar' ? (
                /* Simple Bar Display */
                <motion.div
                    key="bar-view"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    className="space-y-6"
                >
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
                            className={`h-full ${BAR_COLORS[index % BAR_COLORS.length]} shadow-lg`}
                        />
                            {/* Count displayed on bar (centered in the track) */}
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <AnimatedCounter
                                value={option.count}
                                className="text-2xl font-bold text-white drop-shadow-md"
                            />
                            </div>
                        </div>
                    </div>
                    </motion.div>
                ))}
                </motion.div>
            ) : (
                /* Heatmap Grid Display */
                <motion.div
                    key="heatmap-view"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                >
                    {optionCounts.map((option, index) => {
                        // Calculate intensity based on percentage (min 10% opacity so it's visible)
                        const intensity = Math.max(0.1, option.percentage / 100);
                        
                        return (
                            <motion.div
                                key={option.id}
                                layout
                                className="relative rounded-xl overflow-hidden aspect-[4/3] border-2 border-white/10 shadow-lg group"
                            >
                                {/* Background Color Layer */}
                                <motion.div
                                    className="absolute inset-0 bg-primary origin-bottom"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: intensity }}
                                    transition={{ duration: 0.5 }}
                                />
                                
                                {/* Content */}
                                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                                    <h3 className="text-2xl md:text-3xl font-bold mb-2 projector-text drop-shadow-lg">
                                        {option.text}
                                    </h3>
                                    <div className="flex items-center gap-2">
                                        <AnimatedCounter
                                            value={option.count}
                                            className="text-4xl md:text-5xl font-black text-white drop-shadow-xl"
                                        />
                                        <span className="text-sm text-white/80 font-medium bg-black/20 px-2 py-0.5 rounded-full">
                                            {option.percentage}%
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })}
                </motion.div>
            )}
        </AnimatePresence>
      </CardContent>
    </Card>
  );
}
