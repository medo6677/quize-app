import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { GraduationCap, School } from 'lucide-react';
import { Card } from '../components/ui/card';

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-secondary/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
      </div>

      <div className="relative z-10 w-full max-w-4xl space-y-12 text-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold projector-text mb-4 text-white drop-shadow-lg">
            منصة التفاعل التعليمي
          </h1>
          <p className="text-xl text-white/80">اختر نوع الحساب للمتابعة</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8 px-4">
          {/* Student Option */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className="group cursor-pointer glass-effect hover:bg-white/10 transition-all duration-300 border-2 border-white/20 hover:border-primary/50 p-8 h-full flex flex-col items-center justify-center gap-6"
              onClick={() => navigate('/join')}
            >
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center group-hover:bg-primary/40 transition-colors">
                <GraduationCap className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white group-hover:text-primary transition-colors">طالب</h2>
                <p className="text-white/60">انضم إلى جلسة تفاعلية وأجب على الأسئلة</p>
              </div>
            </Card>
          </motion.div>

          {/* Teacher Option */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Card 
              className="group cursor-pointer glass-effect hover:bg-white/10 transition-all duration-300 border-2 border-white/20 hover:border-secondary/50 p-8 h-full flex flex-col items-center justify-center gap-6"
              onClick={() => navigate('/teacher/login')}
            >
              <div className="w-24 h-24 rounded-full bg-secondary/20 flex items-center justify-center group-hover:bg-secondary/40 transition-colors">
                <School className="w-12 h-12 text-white" />
              </div>
              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-white group-hover:text-secondary transition-colors">معلم</h2>
                <p className="text-white/60">أنشئ جلسات وأسئلة وتابع النتائج</p>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
