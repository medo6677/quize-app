import { supabase } from './supabase';

const STUDENT_ID_KEY = 'classroom_student_id';

/**
 * Get or generate anonymous student ID
 * Stored in localStorage for session persistence
 */
export function getStudentId(): string {
  let studentId = localStorage.getItem(STUDENT_ID_KEY);
  
  if (!studentId) {
    studentId = crypto.randomUUID();
    localStorage.setItem(STUDENT_ID_KEY, studentId);
  }
  
  return studentId;
}

/**
 * Sign in teacher with email and password
 */
export async function signInTeacher(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  
  if (error) throw error;
  return data;
}

/**
 * Sign out teacher
 */
export async function signOutTeacher() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

/**
 * Get current teacher user
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
}

/**
 * Check if user is authenticated as teacher
 */
export async function isAuthenticated(): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession();
  return !!session;
}
