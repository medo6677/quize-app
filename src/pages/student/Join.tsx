import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { supabase } from '../../lib/supabase';
import { getStudentId } from '../../lib/auth';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Users } from 'lucide-react';

export default function JoinPage() {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Auto-fill code from URL query param
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const codeParam = params.get('code');
    if (codeParam) {
      setCode(codeParam);
    }
  }, []);

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate code format
      if (code.length !== 6 || !/^\d+$/.test(code)) {
        setError('Please enter a valid 6-digit code');
        setLoading(false);
        return;
      }

      // Check if session exists and is active
      const { data: session, error: sessionError } = await supabase
        .from('sessions')
        .select('*')
        .eq('code', code)
        .eq('is_active', true)
        .single();

      if (sessionError || !session) {
        setError('Invalid or inactive session code');
        setLoading(false);
        return;
      }

      // Generate/get student ID
      getStudentId();

      // Navigate to session
      navigate(`/session/${code}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <Card className="glass-effect projector-shadow">
          <CardHeader className="text-center space-y-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mx-auto w-16 h-16 bg-primary rounded-full flex items-center justify-center"
            >
              <Users className="w-8 h-8 text-white" />
            </motion.div>
            <div>
              <CardTitle className="text-3xl font-bold projector-text">الانضمام للجلسة</CardTitle>
              <CardDescription className="text-base mt-2">
                أدخل الكود المكون من 6 أرقام الذي شاركه معك المعلم
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleJoin} className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="text"
                  placeholder="000000"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="text-center text-2xl font-bold tracking-widest h-14"
                  maxLength={6}
                  autoFocus
                />
                {error && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-destructive text-center"
                  >
                    {error}
                  </motion.p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-lg font-semibold"
                disabled={loading || code.length !== 6}
              >
                {loading ? 'جاري الانضمام...' : 'انضمام'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
