import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { X, Plus, Trash2 } from 'lucide-react';

interface CreateQuestionModalProps {
  sessionId: string;
  onClose: () => void;
  onCreated: () => void;
}

type QuestionType = 'mcq' | 'essay';

export default function CreateQuestionModal({ sessionId, onClose, onCreated }: CreateQuestionModalProps) {
  const [type, setType] = useState<QuestionType>('mcq');
  const [questionText, setQuestionText] = useState('');
  const [options, setOptions] = useState<string[]>(['', '']);
  const [allowMultiple, setAllowMultiple] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const addOption = () => {
    setOptions([...options, '']);
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    setOptions(options.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!questionText.trim()) {
      setError('Please enter a question');
      return;
    }

    if (type === 'mcq') {
      const filledOptions = options.filter((opt) => opt.trim());
      if (filledOptions.length < 2) {
        setError('Please provide at least 2 options');
        return;
      }
    }

    setLoading(true);

    try {
      // Create question
      const { data: question, error: questionError } = await supabase
        .from('questions')
        .insert({
          session_id: sessionId,
          type,
          text: questionText.trim(),
          is_active: false,
          allow_multiple: type === 'mcq' ? allowMultiple : false,
        })
        .select()
        .single();

      if (questionError) throw questionError;

      // If MCQ, create options
      if (type === 'mcq' && question) {
        const filledOptions = options
          .map((text, index) => ({ text: text.trim(), position: index }))
          .filter((opt) => opt.text);

        const { error: optionsError } = await supabase.from('options').insert(
          filledOptions.map((opt) => ({
            question_id: question.id,
            text: opt.text,
            position: opt.position,
          }))
        );

        if (optionsError) throw optionsError;
      }

      onCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Error creating question');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="w-full max-w-2xl"
      >
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl">إنشاء سؤال جديد</CardTitle>
              <Button onClick={onClose} variant="ghost" size="icon">
                <X className="h-5 w-5" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Question Type */}
              <div className="space-y-2">
                <Label>نوع السؤال</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setType('mcq')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      type === 'mcq'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold">تعدد الاختيارات</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      يختار الطلاب إجابة واحدة
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('essay')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      type === 'essay'
                        ? 'border-primary bg-primary/10'
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <p className="font-semibold">سؤال مقالي</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      يكتب الطلاب إجابتهم
                    </p>
                  </button>
                </div>
              </div>

              {/* Question Text */}
              <div className="space-y-2">
                <Label htmlFor="question">السؤال</Label>
                <Textarea
                  id="question"
                  value={questionText}
                  onChange={(e) => setQuestionText(e.target.value)}
                  placeholder="اكتب سؤالك هنا..."
                  className="min-h-[100px]"
                  autoFocus
                />
              </div>

              {/* Allow Multiple (MCQ only) */}
              {type === 'mcq' && (
                <div className="flex items-center space-x-2 space-x-reverse">
                  <input
                    type="checkbox"
                    id="allowMultiple"
                    checked={allowMultiple}
                    onChange={(e) => setAllowMultiple(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="allowMultiple" className="cursor-pointer font-normal">
                    السماح باختيار أكثر من إجابة
                  </Label>
                </div>
              )}

              {/* Options (MCQ only) */}
              {type === 'mcq' && (
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>الخيارات</Label>
                    <Button
                      type="button"
                      onClick={addOption}
                      variant="outline"
                      size="sm"
                    >
                      <Plus className="ml-2 h-4 w-4" />
                      إضافة خيار
                    </Button>
                  </div>
                  <div className="space-y-3">
                    <AnimatePresence>
                      {options.map((option, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="flex gap-2"
                        >
                          <Input
                            value={option}
                            onChange={(e) => updateOption(index, e.target.value)}
                            placeholder={`الخيار ${index + 1}`}
                          />
                          {options.length > 2 && (
                            <Button
                              type="button"
                              onClick={() => removeOption(index)}
                              variant="outline"
                              size="icon"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                </div>
              )}

              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-sm text-destructive"
                >
                  {error}
                </motion.p>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  إلغاء
                </Button>
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? 'جاري الإنشاء...' : 'إنشاء السؤال'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
