// Curriculum Types
export interface Word {
  id: string;
  english: string;
  russian: string;
  transcription: string;
  audioSrc?: string;
}

export interface Round {
  id: string;
  name: string;
  words: Word[];
}

export interface Unit {
  id: string;
  name: string;
  rounds: Round[];
}

export interface OnlineTest {
  id: string;
  name: string;
  description: string;
  durationMinutes: number; // Duration in minutes
  words: Word[];
}


// User and Auth Types
export interface User {
  id:string;
  username: string;
  role: 'teacher' | 'student';
  name: string;
  email?: string | null;
}

export interface UserForAuth extends User {
  password_hash: string;
  created_at?: string | Date;
}

export type AuthenticatedUser = Omit<UserForAuth, 'password_hash'>;

// A single attempt for a single word, which now can have two parts.
export interface WordAttempt {
  wordId: string;
  writtenAnswer?: string;
  writtenCorrect?: boolean;
  choiceAnswer?: string;
  choiceCorrect?: boolean;
}


// Progress and Score Types
export interface StudentRoundProgress {
  studentId: string;
  unitId: string;
  roundId: string;
  score: number;
  attempts: WordAttempt[] | any; // 'any' for JSONB from DB, parse as needed
  completed: boolean;
  timestamp: number;
  attemptCount: number;
}

export interface StudentAttemptHistory {
  id: string;
  studentId: string;
  unitId: string;
  roundId: string;
  score: number;
  attempts: WordAttempt[];
  attemptNumber: number;
  timestamp: string; // ISO string date
}

export interface OfflineTestScore {
  id: string;
  studentId: string;
  teacherId: string;
  testId?: string | null;
  testName?: string;
  studentName?: string;
  score: 2 | 3 | 4 | 5;
  notes?: string | null;
  date: string;
  passed: boolean | null;
}

export interface StudentUnitGrade {
  id: string;
  studentId: string;
  teacherId: string;
  unitId: string;
  unitName?: string;
  studentName?: string;
  grade: 2 | 3 | 4 | 5;
  notes?: string | null;
  date: string;
}

export interface OnlineTestResultAnswer {
  wordId: string;
  userAnswer: string;
  correct: boolean | null;
}

export interface OnlineTestResult {
  id: string;
  studentId: string;
  studentName?: string;
  onlineTestId: string;
  score: number;
  answers: OnlineTestResultAnswer[];
  completedAt: string | null;
  isPassed: boolean | null;
  grade: (2 | 3 | 4 | 5) | null;
  teacherNotes: string | null;
  durationSeconds: number | null;
}

// Chat Types
export interface ChatGroup {
    id: string;
    name: string;
    created_by: string;
    created_at: string;
}

export interface Message {
    id: number;
    sender_id: string;
    sender_name: string;
    sender_role: 'teacher' | 'student';
    content: string;
    group_id: string;
    created_at: string;
    updated_at: string | null;
    is_deleted: boolean;
}
