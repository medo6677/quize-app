import { motion } from 'framer-motion';
import { formatTime } from '../../lib/utils';
import type { Answer } from '../../types/database.types';
import { Card, CardContent } from '../ui/card';
import { Clock } from 'lucide-react';

interface AnswerCardProps {
  answer: Answer & { isLatest: boolean };
  isLatest: boolean;
}

export default function AnswerCard({ answer, isLatest }: AnswerCardProps) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isLatest ? 1 : 0.6,
        scale: isLatest ? 1 : 0.95,
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
    >
      <Card
        className={`transition-all duration-300 ${
          isLatest
            ? 'border-2 border-primary bg-primary/5 shadow-lg'
            : 'border border-muted bg-muted/30'
        }`}
      >
        <CardContent className="p-4 space-y-3">
          {/* Header with timestamp and latest badge */}
          <div className="flex justify-between items-start gap-2">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Clock className="h-3 w-3" />
              <span>{formatTime(answer.created_at)}</span>
            </div>
            {isLatest && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="px-2 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
              >
                الأحدث
              </motion.span>
            )}
          </div>

          {/* Answer text */}
          <p
            className={`text-sm leading-relaxed ${
              isLatest
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            }`}
          >
            {answer.text}
          </p>

          {/* Student ID (first 8 chars for privacy) */}
          <div className="text-xs text-muted-foreground font-mono">
            الطالب: {answer.student_id.slice(0, 8)}...
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
