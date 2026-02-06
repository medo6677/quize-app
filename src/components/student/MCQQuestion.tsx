import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { QuestionWithOptions } from '../../types/database.types';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Check, Loader2 } from 'lucide-react';

interface MCQQuestionProps {
  question: QuestionWithOptions;
  studentId: string;
  onSubmitted: () => void;
}

export default function MCQQuestion({ question, studentId, onSubmitted }: MCQQuestionProps) {
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const toggleOption = (optionId: string) => {
    if (question.allow_multiple) {
      setSelectedOptions((prev) =>
        prev.includes(optionId)
          ? prev.filter((id) => id !== optionId)
          : [...prev, optionId]
      );
    } else {
      setSelectedOptions([optionId]);
    }
  };

  const handleSubmit = async () => {
    if (selectedOptions.length === 0) return;

    setLoading(true);

    try {
      const answersToInsert = selectedOptions.map((optionId) => ({
        question_id: question.id,
        student_id: studentId,
        option_id: optionId,
      }));

      const { error } = await supabase.from('answers').insert(answersToInsert as any);

      if (error) throw error;

      if (error) throw error;

      // Robust Broadcast: Subscribe -> Wait -> Send -> Unsubscribe
      const channel = supabase.channel(`question-${question.id}`);
      
      channel.subscribe(async (status) => {
         if (status === 'SUBSCRIBED') {
            await channel.send({
              type: 'broadcast',
              event: 'new-answer',
              payload: {
                question_id: question.id,
                option_id: answersToInsert[0].option_id, // For MCQ, we send the first selected option (or handle multi)
                options: selectedOptions, // Send full selection for robust handling
              },
            });
            
            // Allow a small buffer for transmission before cleanup
            setTimeout(() => {
               supabase.removeChannel(channel);
            }, 1000);
         }
      });

      setSubmitted(true);
      setTimeout(() => {
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
            {question.allow_multiple && (
              <span className="block mt-2 text-sm md:text-base font-normal text-muted-foreground">
                (يمكنك اختيار أكثر من إجابة)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <AnimatePresence>
              {question.options.map((option, index) => {
                const isSelected = selectedOptions.includes(option.id);
                return (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    onClick={() => toggleOption(option.id)}
                    className={`w-full p-4 md:p-6 text-left rounded-lg border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-lg scale-[1.02]'
                        : 'border-border hover:border-primary/50 hover:bg-accent'
                    }`}
                  >
                    <div className="flex items-center gap-3 md:gap-4">
                      <div
                        className={`w-5 h-5 md:w-6 md:h-6 ${
                          question.allow_multiple ? 'rounded-md' : 'rounded-full'
                        } border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                          isSelected
                            ? 'border-primary bg-primary'
                            : 'border-muted-foreground'
                        }`}
                      >
                        {isSelected && (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            {question.allow_multiple ? (
                              <Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                            ) : (
                              <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-white rounded-full" />
                            )}
                          </motion.div>
                        )}
                      </div>
                      <span className="text-base md:text-xl font-medium projector-text">
                        {option.text}
                      </span>
                    </div>
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            <Button
              onClick={handleSubmit}
              disabled={selectedOptions.length === 0 || loading}
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
