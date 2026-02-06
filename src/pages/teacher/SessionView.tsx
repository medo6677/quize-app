import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import type { Session, Question, QuestionWithOptions } from '../../types/database.types';
import { Button } from '../../components/ui/button';
import { Card, CardContent,CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import CreateQuestionModal from '../../components/teacher/CreateQuestionModal';
import MCQResults from '../../components/teacher/MCQResults';
import EssayResults from '../../components/teacher/EssayResults';
import QRCode from 'react-qr-code';
import { ArrowLeft, Plus, Play, QrCode, ChevronLeft, ChevronRight, Maximize2, Minimize2 } from 'lucide-react';

export default function SessionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeQuestion, setActiveQuestion] = useState<QuestionWithOptions | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [showProjectorMode, setShowProjectorMode] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    loadSession();
    loadQuestions();

    // Subscribe to question changes
    const subscription = supabase
      .channel('session-questions')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'questions',
          filter: `session_id=eq.${id}`,
        },
        () => {
          loadQuestions();
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [id]);

  const loadSession = async () => {
    if (!id) return;
    
    try {
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setSession(data);
    } catch (err) {
      console.error('Error loading session:', err);
      navigate('/teacher/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const loadQuestions = async () => {
    if (!id) return;

    try {
      const { data, error } = await supabase
        .from('questions')
        .select('*')
        .eq('session_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setQuestions(data || []);

      // Load active question with options if MCQ
      const active = data?.find((q) => q.is_active);
      if (active) {
        if (active.type === 'mcq') {
          const { data: options } = await supabase
            .from('options')
            .select('*')
            .eq('question_id', active.id)
            .order('position');

          setActiveQuestion({
            ...active,
            options: options || [],
          });
        } else {
          setActiveQuestion({
            ...active,
            options: [],
          });
        }
      } else {
        setActiveQuestion(null);
      }
    } catch (err) {
      console.error('Error loading questions:', err);
    }
  };

  const activateQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: true })
        .eq('id', questionId);

      if (error) throw error;
      await loadQuestions();
    } catch (err) {
      console.error('Error activating question:', err);
    }
  };

  const deactivateQuestion = async (questionId: string) => {
    try {
      const { error } = await supabase
        .from('questions')
        .update({ is_active: false })
        .eq('id', questionId);

      if (error) throw error;
      await loadQuestions();
    } catch (err) {
      console.error('Error deactivating question:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div className="flex items-center gap-4">
            <Button onClick={() => navigate('/teacher/dashboard')} variant="outline" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-4xl font-bold projector-text">الجلسة: {session.code}</h1>
              <p className="text-muted-foreground mt-1 text-lg">
                يمكن للطلاب الانضمام عبر /join باستخدام الرمز: <span className="font-mono font-bold text-primary text-xl mx-2">{session.code}</span>
              </p>
            </div>
          </div>
          
          <div className="flex gap-4">
            <Button onClick={() => setShowProjectorMode(true)} variant="outline" size="lg" className="text-lg">
              <Maximize2 className="ml-2 h-5 w-5" />
              عرض العرض
            </Button>
            <Button onClick={() => setShowQRModal(true)} variant="outline" size="lg" className="text-lg">
              <QrCode className="ml-2 h-5 w-5" />
              عرض الباركود
            </Button>
            <Button onClick={() => setShowCreateModal(true)} size="lg" className="text-lg">
              <Plus className="ml-2 h-5 w-5" />
              إنشاء سؤال
            </Button>
          </div>
        </motion.div>

        {/* Active Question Results */}
        {activeQuestion && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-8"
          >
            {activeQuestion.type === 'mcq' ? (
              <MCQResults question={activeQuestion} />
            ) : (
              <EssayResults question={activeQuestion} />
            )}
            {/* Navigation Controls */}
            <div className="mt-8 flex justify-between items-center gap-4">
              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const currentIndex = questions.findIndex(q => q.id === activeQuestion.id);
                  if (currentIndex > 0) {
                    activateQuestion(questions[currentIndex - 1].id);
                  }
                }}
                disabled={questions.findIndex(q => q.id === activeQuestion.id) <= 0}
                className="text-lg flex-1"
              >
                <ChevronRight className="ml-2 h-5 w-5" />
                السابق
              </Button>

              <Button
                onClick={() => deactivateQuestion(activeQuestion.id)}
                variant="destructive"
                className="text-lg flex-1"
              >
                إلغاء تفعيل السؤال
              </Button>

              <Button
                variant="outline"
                size="lg"
                onClick={() => {
                  const currentIndex = questions.findIndex(q => q.id === activeQuestion.id);
                  if (currentIndex < questions.length - 1) {
                    activateQuestion(questions[currentIndex + 1].id);
                  }
                }}
                disabled={questions.findIndex(q => q.id === activeQuestion.id) >= questions.length - 1}
                className="text-lg flex-1"
              >
                التالي
                <ChevronLeft className="mr-2 h-5 w-5" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Questions List */}
        <Card className="glass-effect projector-shadow">
          <CardHeader>
            <CardTitle className="text-2xl">جميع الأسئلة</CardTitle>
          </CardHeader>
          <CardContent>
            {questions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-xl">لا توجد أسئلة بعد. قم بإنشاء سؤالك الأول للبدء.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {questions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      question.is_active
                        ? 'border-primary bg-primary/5'
                        : 'border-border bg-background'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${
                            question.type === 'mcq'
                              ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                              : 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                          }`}>
                            {question.type === 'mcq' ? 'اختيار من متعدد' : 'مقال'}
                          </span>
                          {question.is_active && (
                            <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/10 text-green-500 border border-green-500/20">
                              نشط حالياً
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-lg">{question.text}</p>
                      </div>
                      {!question.is_active && (
                        <Button
                          onClick={() => activateQuestion(question.id)}
                          size="sm"
                        >
                          <Play className="ml-2 h-4 w-4" />
                          تفعيل
                        </Button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {showCreateModal && (
        <CreateQuestionModal
          sessionId={id!}
          onClose={() => setShowCreateModal(false)}
          onCreated={loadQuestions}
        />
      )}

      {/* QR Code Modal */}
      {showQRModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 transition-all backdrop-blur-sm" onClick={() => setShowQRModal(false)}>
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center gap-6 max-w-md w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold text-black mb-2">امسح للكود للانضمام</h2>
            <div className="p-4 bg-white rounded-xl shadow-inner border-2 border-gray-100">
               <QRCode value={`${window.location.origin}/join?code=${session.code}`} size={300} />
            </div>
            <div className="text-center space-y-2">
              <p className="text-gray-500 text-lg">كود الجلسة</p>
              <p className="font-mono text-5xl font-black text-black tracking-wider">{session.code}</p>
            </div>
            <Button onClick={() => setShowQRModal(false)} size="lg" className="w-full mt-4">
              إغلاق
            </Button>
          </motion.div>
        </div>
      )}
      {/* Projector Mode Modal */}
      <AnimatePresence>
        {showProjectorMode && activeQuestion && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background z-50 flex flex-col p-8"
          >
            {/* Projector Header */}
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-4">
                 <Button onClick={() => setShowProjectorMode(false)} variant="outline" size="icon">
                  <Minimize2 className="h-6 w-6" />
                </Button>
                <div>
                  <h2 className="text-2xl font-bold text-muted-foreground">وضع العرض</h2>
                  <p className="text-lg font-mono">{session.code}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                 {/* Navigation in Projector Mode */}
                 <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const currentIndex = questions.findIndex(q => q.id === activeQuestion.id);
                    if (currentIndex > 0) {
                      activateQuestion(questions[currentIndex - 1].id);
                    }
                  }}
                  disabled={questions.findIndex(q => q.id === activeQuestion.id) <= 0}
                  className="text-xl h-14 px-8"
                >
                  <ChevronRight className="ml-2 h-6 w-6" />
                  السابق
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => {
                    const currentIndex = questions.findIndex(q => q.id === activeQuestion.id);
                    if (currentIndex < questions.length - 1) {
                      activateQuestion(questions[currentIndex + 1].id);
                    }
                  }}
                  disabled={questions.findIndex(q => q.id === activeQuestion.id) >= questions.length - 1}
                  className="text-xl h-14 px-8"
                >
                  التالي
                  <ChevronLeft className="mr-2 h-6 w-6" />
                </Button>
              </div>
            </div>

            {/* Projector Content */}
            <div className="flex-1 flex items-center justify-center overflow-auto">
              <div className="w-full max-w-6xl">
                 {activeQuestion.type === 'mcq' ? (
                  <MCQResults question={activeQuestion} />
                ) : (
                  <EssayResults question={activeQuestion} />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
