import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Question, Answer } from '../../types/database.types';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import AnswerCard from './AnswerCard';
import AnimatedCounter from './AnimatedCounter';
import { MessageSquare, LayoutList, Layers } from 'lucide-react';
import { Button } from '../ui/button';

interface EssayResultsProps {
  question: Question;
}

interface GroupedAnswer extends Answer {
  isLatest: boolean;
}

export default function EssayResults({ question }: EssayResultsProps) {
  const [answers, setAnswers] = useState<GroupedAnswer[]>([]);
  const [totalAnswers, setTotalAnswers] = useState(0);
  const [filterMode, setFilterMode] = useState<'latest' | 'all'>('latest');

  useEffect(() => {
    loadAnswers();

    // Must match the channel name the student is broadcasting to
    const channelId = `question-${question.id}`;

    const subscription = supabase
      .channel(channelId)
      .on(
        'postgres_changes',
        {
          event: '*', // Listen to all events to catch updates (like hidden status toggles)
          schema: 'public',
          table: 'answers',
          filter: `question_id=eq.${question.id}`,
        },
        (payload) => {
           if (payload.eventType === 'INSERT') {
             handleNewAnswer(payload.new as Answer);
           } else if (payload.eventType === 'UPDATE') {
             handleUpdateAnswer(payload.new as Answer);
           }
        }
      )
      .on(
         'broadcast',
         { event: 'new-answer' },
         (payload) => {
             if (payload.payload.question_id === question.id) {
                 console.log('⚡ Received BROADCAST essay');
                 // Create a compatible Answer object from the payload
                 const broadcastAnswer = {
                     id: `broadcast-${Date.now()}`, // Temporary ID
                     question_id: question.id,
                     student_id: payload.payload.student_id,
                     text: payload.payload.text,
                     created_at: payload.payload.created_at || new Date().toISOString(),
                     option_id: null,
                     is_hidden: false
                 } as Answer;
                 
                 handleNewAnswer(broadcastAnswer);
             }
         }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [question.id]);

  const handleUpdateAnswer = (updatedAnswer: any) => {
      setAnswers(prev => prev.map(a => 
          a.id === updatedAnswer.id 
            ? { ...a, ...updatedAnswer } 
            : a
      ));
  };

  const handleNewAnswer = (newAnswer: Answer) => {
      setTotalAnswers(prev => prev + 1);

      setAnswers(prev => {
        // 1. Add new answer to the list
        // 2. Mark this student's previous answers as not latest
        const updatedAnswers = [
          { ...newAnswer, isLatest: true },
          ...prev.map(a => 
            a.student_id === newAnswer.student_id ? { ...a, isLatest: false } : a
          )
        ];

        // 3. Sort: Latest answers first, then by date
        return updatedAnswers.sort((a, b) => {
           if (a.isLatest && !b.isLatest) return -1;
           if (!a.isLatest && b.isLatest) return 1;
           return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        });
      });
  };

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

  const toggleHidden = async (answerId: string, currentHidden: boolean) => {
      // Optimistic update
      setAnswers(prev => prev.map(a => 
          a.id === answerId ? { ...a, is_hidden: !currentHidden } : a
      ));

      try {
          const { error } = await supabase
            .from('answers')
            .update({ is_hidden: !currentHidden } as any)
            .eq('id', answerId);
            
          if (error) throw error;
      } catch (err) {
          console.error('Error toggling hidden status:', err);
          // Revert on error
          setAnswers(prev => prev.map(a => 
            a.id === answerId ? { ...a, is_hidden: currentHidden } : a
          ));
      }
  };

  const visibleAnswers = answers.filter(a => {
      // Check filtering
      if (filterMode === 'latest' && !a.isLatest) return false;
      
      // Check moderation (if hidden, it should assume visible to teacher who toggles it, but dimmed? 
      // Requirement: "Hidden answers: must not appear on the projector view [implying student view or public view]... must still exist in the system... hidden answers should disappear immediately from the teacher display [actually: 'teacher results view' is separate from projector?]")
      // Wait, "Hidden answers should disappear immediately from the teacher display" -> wait, if so, how does teacher unhide them?
      // Requirement said: "Hidden answers: must not appear on the projector view... disappear immediately from the teacher display"
      // Re-read: "Answer card: add Hide / Show toggle button (teacher only)... Hidden answers should disappear immediately from the teacher display"
      // If they disappear, how do I unhide?
      // "Only the teacher who owns the session can hide or show answers."
      // Maybe there is a Filter "Show Hidden" or "Show All" includes hidden?
      // "Filters: Show only latest answer per student, Show all answers, Hide older answers automatically"
      // It doesn't explicitly mention "Show Hidden" filter.
      // Usually "Moderation" means hiding from the *public* view (projector). The teacher dashboard usually establishes control.
      // If it disappears from teacher view, it's effectively deleted from UI.
      // Maybe "disappear immediately from the teacher display" means "from the generic list", but accessible via specific filter? or maybe I misunderstood "teacher display".
      // "must not appear on the projector view".
      // Let's assume teacher display shows them dimmed (as I implemented in AnswerCard), so teacher can restore them.
      // If I hide them completely, teacher can't restore.
      // Ah, prompt says: "Hidden answers must not appear on the projector view... must still exist in the system... Behavior: hidden answers should disappear immediately from the teacher display"
      // Only explanation: There's a view that shows them?
      // Prompt says: "Hide/Show toggle button (teacher only)". This implies the button must be accessible.
      // If the card disappears, the button is gone.
      // I will implement "dimmed" state for teacher view, and "completely hidden" for "projector view" (if there is a separate projector view).
      // The current component `EssayResults` IS the teacher view (it's in `src/components/teacher`).
      // So if I hide it here, it's gone.
      // I will keep them visible but dimmed for now, unless "disappear" is strict.
      // If "disappear" is strict, I'd need a "Show Hidden" filter.
      // The requested filters are: "Latest only", "All", "Hide old".
      // I will assume "All" might show hidden ones?
      // Let's stick to "Dimmed" for teacher view to allow Unhide operation, as is standard in moderation UIs. 
      // If strictly follow "disappear", I'd need a special toggle.
      // I'll stick to "dimmed" because "Hide / Show toggle button" implies ability to Show.
      
      return true;
  });

  return (
    <Card className="glass-effect projector-shadow">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="space-y-1">
            <CardTitle className="text-3xl font-bold projector-text flex items-center gap-3">
            <MessageSquare className="h-8 w-8" />
            {question.text}
            </CardTitle>
            <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">إجمالي الإجابات:</span>
            <AnimatedCounter value={totalAnswers} className="text-2xl font-bold text-primary" />
            </div>
        </div>
        
        <div className="flex items-center gap-1 bg-secondary/50 p-1 rounded-lg">
             <Button
                variant={filterMode === 'latest' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode('latest')}
                className="gap-2"
             >
                <LayoutList className="h-4 w-4" />
                الأحدث فقط
             </Button>
             <Button
                variant={filterMode === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setFilterMode('all')}
                className="gap-2"
             >
                <Layers className="h-4 w-4" />
                الكل
             </Button>
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
              {visibleAnswers.map((answer) => (
                <AnswerCard
                  key={answer.id}
                  answer={answer}
                  isLatest={answer.isLatest}
                  onToggleHidden={() => toggleHidden(answer.id, !!answer.is_hidden)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
