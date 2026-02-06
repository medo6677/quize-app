export interface Database {
  public: {
    Tables: {
      sessions: {
        Row: {
          id: string;
          code: string;
          is_active: boolean;
          teacher_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          is_active?: boolean;
          teacher_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          is_active?: boolean;
          teacher_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      questions: {
        Row: {
          id: string;
          session_id: string;
          type: 'mcq' | 'essay';
          text: string;
          is_active: boolean;
          allow_multiple: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          type: 'mcq' | 'essay';
          text: string;
          is_active?: boolean;
          allow_multiple?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          type?: 'mcq' | 'essay';
          text?: string;
          is_active?: boolean;
          allow_multiple?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      options: {
        Row: {
          id: string;
          question_id: string;
          text: string;
          position: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          text: string;
          position: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          text?: string;
          position?: number;
          created_at?: string;
        };
      };
      answers: {
        Row: {
          id: string;
          question_id: string;
          student_id: string;
          option_id: string | null;
          text: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          question_id: string;
          student_id: string;
          option_id?: string | null;
          text?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          question_id?: string;
          student_id?: string;
          option_id?: string | null;
          text?: string | null;
          created_at?: string;
        };
      };
    };
  };
}

// Helper types
export type Session = Database['public']['Tables']['sessions']['Row'];
export type Question = Database['public']['Tables']['questions']['Row'];
export type Option = Database['public']['Tables']['options']['Row'];
export type Answer = Database['public']['Tables']['answers']['Row'];

export type QuestionWithOptions = Question & {
  options: Option[];
};

export type AnswerCount = {
  option_id: string;
  count: number;
  option_text: string;
};

export type StudentAnswer = Answer & {
  isLatest: boolean;
};
