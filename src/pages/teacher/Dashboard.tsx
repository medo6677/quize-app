import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { getCurrentUser, signOutTeacher } from '../../lib/auth';
import type { Session } from '../../types/database.types';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { Plus, LogOut, Users, Play, Pause } from 'lucide-react';

export default function DashboardPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [teacherEmail, setTeacherEmail] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadSessions();
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const user = await getCurrentUser();
      setTeacherEmail(user?.email || '');
    } catch (err) {
      navigate('/teacher/login');
    }
  };

  const loadSessions = async () => {
    try {
      const user = await getCurrentUser();
      
      const { data, error } = await supabase
        .from('sessions')
        .select('*')
        .eq('teacher_id', user?.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (err) {
      console.error('Error loading sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  const createSession = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) return;

      // Call the generate_session_code function
      const { data: codeData, error: codeError } = await supabase
        .rpc('generate_session_code');

      if (codeError) throw codeError;

      const { data, error } = await supabase
        .from('sessions')
        .insert({
          code: codeData,
          teacher_id: user.id,
        } as any)
        .select()
        .single();

      if (error) throw error;
      
      if (data) {
        navigate(`/teacher/session/${(data as any).id}`);
      }
    } catch (err) {
      console.error('Error creating session:', err);
    }
  };

  const toggleSessionActive = async (sessionId: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('sessions')
        .update({ is_active: !currentStatus } as any)
        .eq('id', sessionId);

      if (error) throw error;
      await loadSessions();
    } catch (err) {
      console.error('Error toggling session:', err);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOutTeacher();
      navigate('/teacher/login');
    } catch (err) {
      console.error('Error signing out:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <Skeleton className="h-12 w-64" />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-between items-center"
        >
          <div>
            <h1 className="text-4xl font-bold projector-text">لوحة تحكم المعلم</h1>
            <p className="text-muted-foreground mt-2 font-mono" dir="ltr">{teacherEmail}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="ml-2 h-4 w-4" />
            تسجيل الخروج
          </Button>
        </motion.div>

        {/* Create Session Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <Button onClick={createSession} size="lg" className="h-14">
            <Plus className="ml-2 h-5 w-5" />
            إنشاء جلسة جديدة
          </Button>
        </motion.div>

        {/* Sessions Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sessions.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full"
            >
              <Card className="border-dashed">
                <CardContent className="p-12 text-center">
                  <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">لا توجد جلسات بعد</h3>
                  <p className="text-muted-foreground">
                    أنشئ جلستك الأولى لبدء التفاعل مع الطلاب
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            sessions.map((session, index) => (
              <motion.div
                key={session.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="glass-effect projector-shadow hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <CardTitle className="text-2xl font-mono">{session.code}</CardTitle>
                        <CardDescription className="mt-2">
                          {new Date(session.created_at).toLocaleDateString('ar-EG')}
                        </CardDescription>
                      </div>
                      <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        session.is_active
                          ? 'bg-green-500/10 text-green-500 border border-green-500/20'
                          : 'bg-muted text-muted-foreground border border-border'
                      }`}>
                        {session.is_active ? 'نشط' : 'غير نشط'}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <Button
                      onClick={() => navigate(`/teacher/session/${session.id}`)}
                      className="w-full"
                    >
                      إدارة الجلسة
                    </Button>
                    <Button
                      onClick={() => toggleSessionActive(session.id, session.is_active)}
                      variant="outline"
                      className="w-full"
                    >
                      {session.is_active ? (
                        <>
                          <Pause className="ml-2 h-4 w-4" />
                          إلغاء التفعيل
                        </>
                      ) : (
                        <>
                          <Play className="ml-2 h-4 w-4" />
                          تفعيل
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
