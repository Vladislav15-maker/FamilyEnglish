
import { sql } from '@vercel/postgres';
// import bcrypt from 'bcryptjs'; // Hashing is done on user creation, not here. Comparison in NextAuth.
import type { User, StudentRoundProgress, OfflineTestScore, UserForAuth } from './types';

export async function getUserByUsernameForAuth(username: string): Promise<UserForAuth | null> {
  console.log('[Store] getUserByUsernameForAuth called for username:', username);
  try {
    const result = await sql`
      SELECT id, username, password_hash, role, name, email, created_at FROM users WHERE username = ${username};
    `;
    if (result.rows.length === 0) {
      console.log('[Store] User not found in DB for username:', username);
      return null;
    }
    const user = result.rows[0];
    const userIdAsString = typeof user.id === 'string' ? user.id : String(user.id);
    console.log('[Store] User found in DB:', user.username, 'Password hash from DB (first 10 chars):', user.password_hash ? user.password_hash.substring(0,10) + "..." : "N/A", 'Role:', user.role, 'ID:', userIdAsString);
    return {
      id: userIdAsString,
      username: user.username,
      password_hash: user.password_hash,
      role: user.role as 'teacher' | 'student',
      name: user.name,
      email: user.email,
      created_at: user.created_at
    };
  } catch (error) {
    console.error('[Store] Failed to fetch user by username for auth:', error);
    throw new Error(`Database error fetching user ${username}: ${(error as Error).message}`);
  }
}

// Эта функция больше не нужна, так как регистрация удалена.
/*
export async function createUserInDb(userData: {
  name: string;
  username: string;
  passwordPlain: string;
  role: 'teacher' | 'student';
  email?: string;
}): Promise<UserForAuth | null> {
  console.warn('[Store] createUserInDb is deprecated and should not be called as registration is removed.');
  return null;
}
*/

export async function findUserById(userId: string): Promise<User | undefined> {
   console.log('[Store] findUserById called for ID:', userId);
   try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE id = ${userId};`;
    if (result.rows.length === 0) {
      console.log('[Store] User not found in DB for ID:', userId);
      return undefined;
    }
    const user = result.rows[0];
    const userIdAsString = typeof user.id === 'string' ? user.id : String(user.id);
    return {
        id: userIdAsString,
        username: user.username,
        role: user.role as 'teacher' | 'student',
        name: user.name,
        email: user.email
    };
  } catch (error) {
    console.error('[Store] Failed to find user by id:', error);
    return undefined;
  }
}

export async function getAllStudents(): Promise<User[]> {
  console.log('[Store] getAllStudents called');
  try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE role = 'student';`;
    return result.rows.map(row => ({
        id: typeof row.id === 'string' ? row.id : String(row.id),
        username: row.username,
        role: row.role as 'teacher' | 'student',
        name: row.name,
        email: row.email
    }));
  } catch (error) {
    console.error('[Store] Failed to get all students:', error);
    return [];
  }
}

export async function getStudentRoundProgress(studentId: string, unitId: string, roundId: string): Promise<StudentRoundProgress | undefined> {
  console.log(`[Store] getStudentRoundProgress for student ${studentId}, unit ${unitId}, round ${roundId}`);
  try {
    const result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
      SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
      FROM student_progress
      WHERE student_id = ${studentId} AND unit_id = ${unitId} AND round_id = ${roundId};
    `;
    if (result.rows.length === 0) return undefined;
    const row = result.rows[0];
    return {
        studentId: row.student_id,
        unitId: row.unit_id,
        roundId: row.round_id,
        score: row.score,
        attempts: row.attempts, 
        completed: row.completed,
        timestamp: Number(row.timestamp)
    };
  } catch (error) {
    console.error('[Store] Failed to get student round progress:', error);
    return undefined;
  }
}

export async function getAllStudentProgress(studentIdFilter: string): Promise<StudentRoundProgress[]> {
  console.log(`[Store] getAllStudentProgress called for studentIdFilter: '${studentIdFilter}' (empty means all)`);
   try {
    let result;
    if (studentIdFilter === '' || !studentIdFilter) {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress;
      `;
    } else {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId'> & {student_id: string, unit_id: string, round_id: string}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp
        FROM student_progress WHERE student_id = ${studentIdFilter};
      `;
    }
    return result.rows.map(row => ({
        studentId: row.student_id,
        unitId: row.unit_id,
        roundId: row.round_id,
        score: row.score,
        attempts: row.attempts, 
        completed: row.completed,
        timestamp: Number(row.timestamp)
    }));
  } catch (error) {
    console.error('[Store] Failed to get all student progress:', error);
    return [];
  }
}


export async function saveStudentRoundProgress(progress: StudentRoundProgress): Promise<void> {
  console.log(`[Store] Attempting to save student round progress. Data received:`);
  console.log(`[Store] Student ID: ${progress.studentId} (type: ${typeof progress.studentId})`);
  console.log(`[Store] Unit ID: ${progress.unitId} (type: ${typeof progress.unitId})`);
  console.log(`[Store] Round ID: ${progress.roundId} (type: ${typeof progress.roundId})`);
  console.log(`[Store] Score: ${progress.score} (type: ${typeof progress.score})`);
  console.log(`[Store] Completed: ${progress.completed} (type: ${typeof progress.completed})`);
  console.log(`[Store] Timestamp (original): ${progress.timestamp} (type: ${typeof progress.timestamp})`);
  const attemptsCount = progress.attempts ? (Array.isArray(progress.attempts) ? progress.attempts.length : 'N/A or not an array') : 'N/A or null';
  console.log(`[Store] Attempts count: ${attemptsCount}`);
  if (progress.attempts && Array.isArray(progress.attempts) && progress.attempts.length > 0) {
    console.log(`[Store] First attempt detail: wordId=${progress.attempts[0].wordId}, userAnswer=${progress.attempts[0].userAnswer}, correct=${progress.attempts[0].correct}`);
  }

  try {
    const timestampToSave = typeof progress.timestamp === 'number' ? progress.timestamp : new Date(progress.timestamp).getTime();
    console.log(`[Store] Timestamp to save (numeric): ${timestampToSave}`);
    const attemptsJson = JSON.stringify(progress.attempts);
    console.log(`[Store] Attempts JSON (first 200 chars): ${attemptsJson.substring(0, 200)}${attemptsJson.length > 200 ? '...' : ''}`);

    await sql`
      INSERT INTO student_progress (student_id, unit_id, round_id, score, attempts, completed, timestamp)
      VALUES (${progress.studentId}, ${progress.unitId}, ${progress.roundId}, ${progress.score}, ${attemptsJson}::jsonb, ${progress.completed}, ${timestampToSave})
      ON CONFLICT (student_id, unit_id, round_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        attempts = EXCLUDED.attempts,
        completed = EXCLUDED.completed,
        timestamp = EXCLUDED.timestamp;
    `;
    console.log(`[Store] Successfully saved/updated progress for student ${progress.studentId}, round ${progress.roundId}`);
  } catch (error) {
    console.error('[Store] Failed to save student round progress. Details:');
    const dbError = error as any;
    console.error(`[Store] Error Code: ${dbError.code}`);
    console.error(`[Store] Error Message: ${dbError.message}`);
    // console.error(`[Store] Error Stack: ${dbError.stack}`); // Stack может быть очень длинным
    console.error(`[Store] Error Constraint: ${dbError.constraint}`); // Полезно для ошибок FK или Unique
    console.error(`[Store] Error Detail: ${dbError.detail}`);
    throw error;
  }
}


export async function getOfflineScoresForStudent(studentId: string): Promise<OfflineTestScore[]> {
  console.log(`[Store] getOfflineScoresForStudent for student ${studentId}`);
   try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId'> & {student_id: string, teacher_id: string}>`
      SELECT id, student_id, teacher_id, score, notes, date
      FROM offline_scores WHERE student_id = ${studentId} ORDER BY date DESC;
    `;
    return result.rows.map(row => ({
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date 
    }));
  } catch (error) {
    console.error('[Store] Failed to get offline scores for student:', error);
    return [];
  }
}

export async function getAllOfflineScores(): Promise<OfflineTestScore[]> {
  console.log('[Store] getAllOfflineScores called');
  try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId'> & {student_id: string, teacher_id: string}>`
      SELECT id, student_id, teacher_id, score, notes, date
      FROM offline_scores ORDER BY date DESC;
    `;
    return result.rows.map(row => ({
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date
    }));
  } catch (error) {
    console.error('[Store] Failed to get all offline scores:', error);
    return [];
  }
}

export async function addOfflineScore(scoreData: Omit<OfflineTestScore, 'id' | 'date'>): Promise<OfflineTestScore> {
  console.log(`[Store] addOfflineScore for student ${scoreData.studentId} by teacher ${scoreData.teacherId}`);
  const currentDate = new Date().toISOString();
  try {
    const result = await sql`
      INSERT INTO offline_scores (student_id, teacher_id, score, notes, date)
      VALUES (${scoreData.studentId}, ${scoreData.teacherId}, ${scoreData.score}, ${scoreData.notes || null}, ${currentDate})
      RETURNING id, student_id, teacher_id, score, notes, date;
    `;
    const row = result.rows[0];
    return {
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date
    };
  } catch (error) {
    console.error('[Store] Failed to add offline score:', error);
    throw error;
  }
}

export function resetStore() {
  console.warn("[Store] resetStore is a no-op when using a persistent database.");
}
