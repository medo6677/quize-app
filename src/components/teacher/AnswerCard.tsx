import { motion } from 'framer-motion';
import { formatTime } from '../../lib/utils';
import type { Answer } from '../../types/database.types';
import { Card, CardContent } from '../ui/card';
import { Clock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';

interface AnswerCardProps {
  answer: Answer & { isLatest: boolean };
  isLatest: boolean;
  onToggleHidden?: () => void;
}

export default function AnswerCard({ answer, isLatest, onToggleHidden }: AnswerCardProps) {
  const isHidden = answer.is_hidden;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{
        opacity: isHidden ? 0.5 : (isLatest ? 1 : 0.6),
        scale: isLatest ? 1 : 0.95,
        filter: isHidden ? 'grayscale(100%) blur(1px)' : 'none',
      }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{
        layout: { type: 'spring', stiffness: 300, damping: 30 },
        opacity: { duration: 0.3 },
        scale: { duration: 0.3 },
      }}
    >
      <Card
        className={`transition-all duration-300 group relative overflow-hidden ${
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
            
            <div className="flex items-center gap-2">
                {isLatest && (
                <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="px-2 py-1 rounded-full text-xs font-semibold bg-primary text-primary-foreground"
                >
                    الأحدث
                </motion.span>
                )}
                
                {onToggleHidden && (
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleHidden();
                        }}
                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                        title={isHidden ? "إظهار الإجابة" : "إخفاء الإجابة"}
                    >
                        {isHidden ? (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                        ) : (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                        )}
                    </Button>
                )}
            </div>
          </div>

          {/* Answer text */}
          <p
            className={`text-sm leading-relaxed ${
              isLatest
                ? 'font-medium text-foreground'
                : 'text-muted-foreground'
            } ${isHidden ? 'line-through decoration-muted-foreground/50' : ''}`}
          >
            {answer.text}
          </p>

          {/* Student ID (first 8 chars for privacy) */}
          <div className="text-xs text-muted-foreground font-mono">
            الطالب: {answer.student_id.slice(0, 8)}...
          </div>
          
          {isHidden && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="bg-background/80 px-3 py-1 rounded-full text-xs font-bold border border-border shadow-sm">
                      مخفي
                  </span>
              </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
