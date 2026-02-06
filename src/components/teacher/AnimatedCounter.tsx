import { useEffect, useRef } from 'react';
import { motion, useSpring, useTransform } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  className?: string;
}

export default function AnimatedCounter({ value, className = '' }: AnimatedCounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const spring = useSpring(0, { stiffness: 100, damping: 20 });
  const display = useTransform(spring, (current) => Math.round(current));

  useEffect(() => {
    spring.set(value);
  }, [value, spring]);

  useEffect(() => {
    const unsubscribe = display.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = latest.toString();
      }
    });

    return () => unsubscribe();
  }, [display]);

  return <motion.span ref={ref} className={className}>0</motion.span>;
}
