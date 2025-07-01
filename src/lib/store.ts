import { sql } from '@vercel/postgres';
import type { User, StudentRoundProgress, OfflineTestScore, UserForAuth, StudentUnitGrade, StudentAttemptHistory, OnlineTestResult } from './types';

// This log runs when the module is first loaded.
// If POSTGRES_URL is not set here when running on the server, then .env.local is not loaded correctly server-side.
// If this log appears in the BROWSER console saying "NOT SET", it means this module was bundled for the client.
console.log('[Store Module] Initializing. process.env.POSTGRES_URL status during module load:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
if (!process.env.POSTGRES_URL && typeof window === 'undefined') { // Log server-side only missing env
  console.error('[Store Module] CRITICAL SERVER-SIDE: POSTGRES_URL is not defined in the environment when store.ts module is loaded!');
}


export async function getUserByUsernameForAuth(username: string): Promise<UserForAuth | null> {
  // console.log('[Store] getUserByUsernameForAuth called for username:', username);
  // console.log('[Store] Inside getUserByUsernameForAuth - POSTGRES_URL check:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getUserByUsernameForAuth (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      SELECT id, username, password_hash, role, name, email, created_at FROM users WHERE username = ${username};
    `;
    if (result.rows.length === 0) {
      // console.log('[Store] User not found in DB for username:', username);
      return null;
    }
    const user = result.rows[0];
    const userIdAsString = typeof user.id === 'string' ? user.id : String(user.id);
    // console.log('[Store] User found in DB:', user.username, 'Password hash from DB (first 10 chars):', user.password_hash ? user.password_hash.substring(0,10) + "..." : "N/A", 'Role:', user.role, 'ID:', userIdAsString);
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
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getUserByUsernameForAuth: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to fetch user by username for auth:', error);
    throw error; // Re-throw original error
  }
}

export async function findUserById(userId: string): Promise<User | undefined> {
   // console.log('[Store] findUserById called for ID:', userId);
   // console.log('[Store] Inside findUserById - POSTGRES_URL check:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
   if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in findUserById (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
   try {
    const result = await sql`SELECT id, username, role, name, email FROM users WHERE id = ${userId};`;
    if (result.rows.length === 0) {
      // console.log('[Store] User not found in DB for ID:', userId);
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
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in findUserById: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to find user by id:', error);
    throw error; // Re-throw original error
  }
}

export async function getAllStudents(): Promise<User[]> {
  // console.log('[Store] getAllStudents called');
  // console.log('[Store] Inside getAllStudents - POSTGRES_URL check:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAllStudents (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
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
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getAllStudents: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to get all students:', error);
    throw error; // Re-throw original error
  }
}

export async function getStudentRoundProgress(studentId: string, unitId: string, roundId: string): Promise<StudentRoundProgress | undefined> {
  // console.log(`[Store] getStudentRoundProgress for student ${studentId}, unit ${unitId}, round ${roundId}`);
  // console.log('[Store] Inside getStudentRoundProgress - POSTGRES_URL check:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
   if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getStudentRoundProgress (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId' | 'attemptCount'> & {student_id: string, unit_id: string, round_id: string, attempt_count: number}>`
      SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp, attempt_count
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
        timestamp: Number(row.timestamp),
        attemptCount: row.attempt_count
    };
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getStudentRoundProgress: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to get student round progress:', error);
    throw error; // Re-throw original error
  }
}

export async function getAllStudentProgress(studentIdFilter: string): Promise<StudentRoundProgress[]> {
  // console.log(`[Store] getAllStudentProgress called for studentIdFilter: '${studentIdFilter}' (empty means all)`);
  // console.log('[Store] Inside getAllStudentProgress - POSTGRES_URL check:', process.env.POSTGRES_URL ? 'SET' : 'NOT SET');
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAllStudentProgress (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
   try {
    let result;
    if (studentIdFilter === '' || !studentIdFilter) {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId' | 'attemptCount'> & {student_id: string, unit_id: string, round_id: string, attempt_count: number}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp, attempt_count
        FROM student_progress;
      `;
    } else {
      result = await sql<Omit<StudentRoundProgress, 'studentId' | 'unitId' | 'roundId' | 'attemptCount'> & {student_id: string, unit_id: string, round_id: string, attempt_count: number}>`
        SELECT student_id, unit_id, round_id, score, attempts, completed, timestamp, attempt_count
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
        timestamp: Number(row.timestamp),
        attemptCount: row.attempt_count
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getAllStudentProgress: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to get all student progress:', error);
    throw error; // Re-throw original error
  }
}

export async function saveStudentRoundProgress(progress: Omit<StudentRoundProgress, 'attemptCount'>): Promise<void> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in saveStudentRoundProgress (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }

  const timestampToSave = new Date(progress.timestamp);
  const attemptsJson = JSON.stringify(progress.attempts);

  try {
     const progressResult = await sql`
      INSERT INTO student_progress (student_id, unit_id, round_id, score, attempts, completed, "timestamp", attempt_count)
      VALUES (${progress.studentId}, ${progress.unitId}, ${progress.roundId}, ${progress.score}, ${attemptsJson}::jsonb, ${progress.completed}, ${progress.timestamp}, 1)
      ON CONFLICT (student_id, unit_id, round_id)
      DO UPDATE SET
        score = EXCLUDED.score,
        attempts = EXCLUDED.attempts,
        completed = EXCLUDED.completed,
        "timestamp" = EXCLUDED."timestamp",
        attempt_count = student_progress.attempt_count + 1
      RETURNING attempt_count;
    `;
    
    const newAttemptCount = progressResult.rows[0].attempt_count;
    console.log(`[Store] Progress saved. New attempt count: ${newAttemptCount}`);

    // Now, save this attempt to the history table
    await sql`
      INSERT INTO student_attempt_history (student_id, unit_id, round_id, score, attempts, attempt_number, "timestamp")
      VALUES (
        ${progress.studentId}, 
        ${progress.unitId}, 
        ${progress.roundId}, 
        ${progress.score}, 
        ${attemptsJson}::jsonb, 
        ${newAttemptCount}, 
        ${timestampToSave}
      );
    `;
    console.log(`[Store] Attempt #${newAttemptCount} saved to history.`);

  } catch (error) {
    const dbError = error as any;
    console.error(`[Store] DB Error in saveStudentRoundProgress (code: ${dbError.code}): ${dbError.message}. Full error:`, dbError);
    if (dbError.code === 'missing_connection_string' || dbError.message?.includes('missing_connection_string')) {
        console.error('[Store] CRITICAL in saveStudentRoundProgress: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    throw error; 
  }
}

export async function getAttemptHistoryForRound(studentId: string, unitId: string, roundId: string): Promise<StudentAttemptHistory[]> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAttemptHistoryForRound (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql<Omit<StudentAttemptHistory, 'studentId' | 'unitId' | 'roundId' | 'attemptNumber'> & {student_id: string, unit_id: string, round_id: string, attempt_number: number}>`
      SELECT id, student_id, unit_id, round_id, score, attempts, attempt_number, timestamp
      FROM student_attempt_history
      WHERE student_id = ${studentId} AND unit_id = ${unitId} AND round_id = ${roundId}
      ORDER BY attempt_number ASC;
    `;
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      unitId: row.unit_id,
      roundId: row.round_id,
      score: row.score,
      attempts: row.attempts,
      attemptNumber: row.attempt_number,
      timestamp: row.timestamp,
    }));
  } catch (error) {
    console.error('[Store] Failed to get attempt history for round:', error);
    throw error;
  }
}


export async function getOfflineScoresForStudent(studentId: string): Promise<OfflineTestScore[]> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getOfflineScoresForStudent (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
   try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId' | 'studentName' | 'testId'> & {student_id: string, teacher_id: string, test_id: string}>`
      SELECT id, student_id, teacher_id, score, notes, date, passed, test_id
      FROM offline_scores WHERE student_id = ${studentId} ORDER BY date DESC;
    `;
    return result.rows.map(row => ({
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date,
        passed: row.passed,
        testId: row.test_id,
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getOfflineScoresForStudent: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to get offline scores for student:', error);
    throw error; // Re-throw original error
  }
}

export async function getAllOfflineScores(): Promise<OfflineTestScore[]> {
   if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAllOfflineScores (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql<Omit<OfflineTestScore, 'studentId' | 'teacherId' | 'testId'> & {student_id: string, teacher_id: string, student_name: string, test_id: string }>`
      SELECT os.id, os.student_id, os.teacher_id, os.score, os.notes, os.date, os.passed, os.test_id, u.name as student_name
      FROM offline_scores os
      JOIN users u ON os.student_id = u.id
      ORDER BY os.date DESC;
    `;
    return result.rows.map(row => ({
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        studentName: row.student_name,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        date: row.date,
        passed: row.passed,
        testId: row.test_id,
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getAllOfflineScores: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    console.error('[Store] Failed to get all offline scores:', error);
    throw error; // Re-throw original error
  }
}

export async function addOfflineScore(scoreData: Omit<OfflineTestScore, 'id' | 'date' | 'studentName' | 'testName'>): Promise<OfflineTestScore> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in addOfflineScore (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  const currentDate = new Date().toISOString();
  try {
    const result = await sql`
      INSERT INTO offline_scores (student_id, teacher_id, score, notes, passed, date, test_id)
      VALUES (${scoreData.studentId}, ${scoreData.teacherId}, ${scoreData.score}, ${scoreData.notes || null}, ${scoreData.passed}, ${currentDate}, ${scoreData.testId || null})
      RETURNING id, student_id, teacher_id, score, notes, passed, date, test_id;
    `;
    const row = result.rows[0];
    return {
        id: typeof row.id === 'string' ? row.id : String(row.id),
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        passed: row.passed,
        date: row.date,
        testId: row.test_id
    };
  } catch (error) {
    const dbError = error as any;
    console.error(`[Store] DB Error in addOfflineScore (code: ${dbError.code}): ${dbError.message}. Full error:`, dbError);
    if (dbError.code === 'missing_connection_string' || dbError.message?.includes('missing_connection_string')) {
        console.error('[Store] CRITICAL in addOfflineScore: missing_connection_string. POSTGRES_URL env var was likely not found by @vercel/postgres.');
    }
    throw error;
  }
}

export async function updateOfflineScore(scoreId: string, scoreData: Pick<OfflineTestScore, 'score' | 'notes' | 'passed' | 'testId'>): Promise<OfflineTestScore> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in updateOfflineScore (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      UPDATE offline_scores
      SET score = ${scoreData.score}, notes = ${scoreData.notes || null}, passed = ${scoreData.passed}, test_id = ${scoreData.testId || null}
      WHERE id = ${scoreId}
      RETURNING id, student_id, teacher_id, score, notes, passed, date, test_id;
    `;
    if (result.rows.length === 0) {
      throw new Error("Score not found for updating.");
    }
    const row = result.rows[0];
    return {
        id: row.id,
        studentId: row.student_id,
        teacherId: row.teacher_id,
        score: row.score as 2 | 3 | 4 | 5,
        notes: row.notes,
        passed: row.passed,
        date: row.date,
        testId: row.test_id,
    };
  } catch (error) {
    console.error('[Store] Failed to update offline score:', error);
    throw error;
  }
}

export async function deleteOfflineScore(scoreId: string): Promise<void> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in deleteOfflineScore (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    await sql`DELETE FROM offline_scores WHERE id = ${scoreId};`;
  } catch (error) {
    console.error('[Store] Failed to delete offline score:', error);
    throw error;
  }
}


// --- Student Unit Grade Functions ---

export async function addStudentUnitGrade(
  gradeData: Omit<StudentUnitGrade, 'id' | 'date' | 'teacherId' | 'studentName' | 'unitName'>,
  teacherId: string
): Promise<StudentUnitGrade> {
  console.log(`[Store] addStudentUnitGrade for student ${gradeData.studentId}, unit ${gradeData.unitId} by teacher ${teacherId}`);
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in addStudentUnitGrade (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  const currentDate = new Date().toISOString();
  
  try {
    const existing = await sql`
      SELECT id from student_unit_grades 
      WHERE student_id = ${gradeData.studentId} AND unit_id = ${gradeData.unitId};
    `;

    let result;
    if (existing.rows.length > 0) {
      console.log(`[Store] Found existing unit grade. Updating grade ID: ${existing.rows[0].id}`);
      result = await sql`
        UPDATE student_unit_grades
        SET 
          grade = ${gradeData.grade}, 
          notes = ${gradeData.notes || null}, 
          date = ${currentDate}, 
          teacher_id = ${teacherId}
        WHERE id = ${existing.rows[0].id}
        RETURNING id, student_id, teacher_id, unit_id, grade, notes, date;
      `;
    } else {
      console.log(`[Store] No existing unit grade found. Inserting new grade.`);
      result = await sql`
        INSERT INTO student_unit_grades (student_id, teacher_id, unit_id, grade, notes, date)
        VALUES (${gradeData.studentId}, ${teacherId}, ${gradeData.unitId}, ${gradeData.grade}, ${gradeData.notes || null}, ${currentDate})
        RETURNING id, student_id, teacher_id, unit_id, grade, notes, date;
      `;
    }
    
    if (result.rows.length === 0) {
        throw new Error("Failed to insert or update the unit grade.");
    }
    
    const row = result.rows[0];
    return {
      id: typeof row.id === 'string' ? row.id : String(row.id),
      studentId: row.student_id,
      teacherId: row.teacher_id,
      unitId: row.unit_id,
      grade: row.grade as 2 | 3 | 4 | 5,
      notes: row.notes,
      date: row.date,
    };
  } catch (error) {
    const dbError = error as any;
    console.error(`[Store] DB Error in addStudentUnitGrade (code: ${dbError.code}): ${dbError.message}. Full error:`, dbError);
    if (dbError.code === 'missing_connection_string' || dbError.message?.includes('missing_connection_string')) {
        console.error('[Store] CRITICAL in addStudentUnitGrade: missing_connection_string.');
    }
    // Re-throw the error so the API route can catch it and send a proper response.
    throw error;
  }
}


export async function updateStudentUnitGrade(gradeId: string, gradeData: Pick<StudentUnitGrade, 'grade' | 'notes'>): Promise<StudentUnitGrade> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in updateStudentUnitGrade (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      UPDATE student_unit_grades
      SET grade = ${gradeData.grade}, notes = ${gradeData.notes || null}
      WHERE id = ${gradeId}
      RETURNING id, student_id, teacher_id, unit_id, grade, notes, date;
    `;
    if (result.rows.length === 0) {
      throw new Error("Unit grade not found for updating.");
    }
    const row = result.rows[0];
    return {
      id: row.id,
      studentId: row.student_id,
      teacherId: row.teacher_id,
      unitId: row.unit_id,
      grade: row.grade as 2 | 3 | 4 | 5,
      notes: row.notes,
      date: row.date,
    };
  } catch (error) {
    console.error('[Store] Failed to update unit grade:', error);
    throw error;
  }
}

export async function deleteStudentUnitGrade(gradeId: string): Promise<void> {
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in deleteStudentUnitGrade (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    await sql`DELETE FROM student_unit_grades WHERE id = ${gradeId};`;
  } catch (error) {
    console.error('[Store] Failed to delete unit grade:', error);
    throw error;
  }
}

export async function getUnitGradesForStudent(studentId: string): Promise<StudentUnitGrade[]> {
  console.log(`[Store] getUnitGradesForStudent for student ${studentId}`);
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getUnitGradesForStudent (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      SELECT sug.id, sug.student_id, sug.teacher_id, sug.unit_id, sug.grade, sug.notes, sug.date, u.name as student_name
      FROM student_unit_grades sug
      JOIN users u ON sug.student_id = u.id
      WHERE sug.student_id = ${studentId} 
      ORDER BY sug.date DESC;
    `;
    return result.rows.map(row => ({
      id: typeof row.id === 'string' ? row.id : String(row.id),
      studentId: row.student_id,
      teacherId: row.teacher_id,
      unitId: row.unit_id,
      studentName: row.student_name,
      grade: row.grade as 2 | 3 | 4 | 5,
      notes: row.notes,
      date: row.date,
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getUnitGradesForStudent: missing_connection_string.');
    }
    console.error('[Store] Failed to get unit grades for student:', error);
    throw error; 
  }
}

export async function getAllUnitGradesByTeacher(teacherId: string): Promise<StudentUnitGrade[]> {
  console.log(`[Store] getAllUnitGradesByTeacher for teacher ${teacherId}`);
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAllUnitGradesByTeacher (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      SELECT sug.id, sug.student_id, sug.teacher_id, sug.unit_id, sug.grade, sug.notes, sug.date, u.name as student_name
      FROM student_unit_grades sug
      JOIN users u ON sug.student_id = u.id
      WHERE sug.teacher_id = ${teacherId} 
      ORDER BY sug.date DESC;
    `;
    return result.rows.map(row => ({
      id: typeof row.id === 'string' ? row.id : String(row.id),
      studentId: row.student_id,
      teacherId: row.teacher_id,
      unitId: row.unit_id,
      studentName: row.student_name, 
      grade: row.grade as 2 | 3 | 4 | 5,
      notes: row.notes,
      date: row.date,
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getAllUnitGradesByTeacher: missing_connection_string.');
    }
    console.error('[Store] Failed to get all unit grades by teacher:', error);
    throw error;
  }
}

export async function getAllUnitGrades(): Promise<StudentUnitGrade[]> {
  console.log(`[Store] getAllUnitGrades called`);
  if (!process.env.POSTGRES_URL && typeof window === 'undefined') {
    console.error('[Store] CRITICAL in getAllUnitGrades (SERVER-SIDE): POSTGRES_URL is NOT SET.');
  }
  try {
    const result = await sql`
      SELECT sug.id, sug.student_id, sug.teacher_id, sug.unit_id, sug.grade, sug.notes, sug.date, u.name as student_name
      FROM student_unit_grades sug
      JOIN users u ON sug.student_id = u.id
      ORDER BY sug.date DESC;
    `;
    return result.rows.map(row => ({
      id: typeof row.id === 'string' ? row.id : String(row.id),
      studentId: row.student_id,
      teacherId: row.teacher_id, 
      unitId: row.unit_id,
      studentName: row.student_name, 
      grade: row.grade as 2 | 3 | 4 | 5,
      notes: row.notes,
      date: row.date,
    }));
  } catch (error) {
    const VercelPostgresError = (error as any)?.constructor?.name === 'VercelPostgresError' ? (error as any) : null;
    if (VercelPostgresError && VercelPostgresError.code === 'missing_connection_string') {
        console.error('[Store] CRITICAL in getAllUnitGrades: missing_connection_string.');
    }
    console.error('[Store] Failed to get all unit grades:', error);
    throw error; 
  }
}

// --- Online Test Functions ---

export async function submitOnlineTestResult(
  resultData: Omit<OnlineTestResult, 'id' | 'completedAt' | 'isPassed' | 'grade' | 'teacherNotes'>
): Promise<OnlineTestResult> {
  const { studentId, onlineTestId, score, answers, durationSeconds } = resultData;
  const answersJson = JSON.stringify(answers);
  
  try {
    // Upsert logic: if a student retakes a test, update their old result.
    const result = await sql`
      INSERT INTO online_test_results (student_id, online_test_id, score, answers, duration_seconds)
      VALUES (${studentId}, ${onlineTestId}, ${score}, ${answersJson}::jsonb, ${durationSeconds ?? null})
      ON CONFLICT (student_id, online_test_id) DO UPDATE SET
        score = EXCLUDED.score,
        answers = EXCLUDED.answers,
        completed_at = CURRENT_TIMESTAMP,
        is_passed = NULL, -- Reset grading status on retake
        grade = NULL,
        teacher_notes = NULL,
        duration_seconds = EXCLUDED.duration_seconds
      RETURNING id, student_id, online_test_id, score, answers, completed_at, is_passed, grade, teacher_notes, duration_seconds;
    `;

    const row = result.rows[0];
    return {
      id: row.id,
      studentId: row.student_id,
      onlineTestId: row.online_test_id,
      score: row.score,
      answers: row.answers,
      completedAt: row.completed_at,
      isPassed: row.is_passed,
      grade: row.grade as (2 | 3 | 4 | 5) | null,
      teacherNotes: row.teacher_notes,
      durationSeconds: row.duration_seconds,
    };
  } catch (error) {
    console.error('[Store] Failed to submit online test result:', error);
    throw error;
  }
}

export async function getOnlineTestResults(testId: string): Promise<(OnlineTestResult & { studentName: string })[]> {
  try {
    const result = await sql`
      SELECT
        otr.id,
        otr.student_id,
        u.name as student_name,
        otr.online_test_id,
        otr.score,
        otr.answers,
        otr.completed_at,
        otr.is_passed,
        otr.grade,
        otr.teacher_notes,
        otr.duration_seconds
      FROM online_test_results otr
      JOIN users u ON otr.student_id = u.id
      WHERE otr.online_test_id = ${testId}
      ORDER BY otr.score DESC, otr.completed_at ASC;
    `;
    return result.rows.map(row => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      onlineTestId: row.online_test_id,
      score: row.score,
      answers: row.answers,
      completedAt: row.completed_at,
      isPassed: row.is_passed,
      grade: row.grade,
      teacherNotes: row.teacher_notes,
      durationSeconds: row.duration_seconds,
    }));
  } catch (error) {
    console.error(`[Store] Failed to get online test results for test ${testId}:`, error);
    throw error;
  }
}

export async function getOnlineTestResultById(resultId: string): Promise<(OnlineTestResult & { studentName: string }) | null> {
    try {
        const result = await sql`
            SELECT
                otr.id,
                otr.student_id,
                u.name as student_name,
                otr.online_test_id,
                otr.score,
                otr.answers,
                otr.completed_at,
                otr.is_passed,
                otr.grade,
                otr.teacher_notes,
                otr.duration_seconds
            FROM online_test_results otr
            JOIN users u ON otr.student_id = u.id
            WHERE otr.id = ${resultId};
        `;
        if (result.rows.length === 0) return null;

        const row = result.rows[0];
        return {
            id: row.id,
            studentId: row.student_id,
            studentName: row.student_name,
            onlineTestId: row.online_test_id,
            score: row.score,
            answers: row.answers,
            completedAt: row.completed_at,
            isPassed: row.is_passed,
            grade: row.grade,
            teacherNotes: row.teacher_notes,
            durationSeconds: row.duration_seconds,
        };
    } catch (error) {
        console.error(`[Store] Failed to get online test result by ID ${resultId}:`, error);
        throw error;
    }
}


export async function getStudentOnlineTestResults(studentId: string): Promise<OnlineTestResult[]> {
    try {
        const result = await sql`
            SELECT id, student_id, online_test_id, score, answers, completed_at, is_passed, grade, teacher_notes, duration_seconds
            FROM online_test_results
            WHERE student_id = ${studentId}
            ORDER BY completed_at DESC;
        `;
        return result.rows.map(row => ({
            id: row.id,
            studentId: row.student_id,
            onlineTestId: row.online_test_id,
            score: row.score,
            answers: row.answers,
            completedAt: row.completed_at,
            isPassed: row.is_passed,
            grade: row.grade,
            teacherNotes: row.teacher_notes,
            durationSeconds: row.duration_seconds,
        }));
    } catch (error) {
        console.error(`[Store] Failed to get online test results for student ${studentId}:`, error);
        throw error;
    }
}


export async function gradeOnlineTestResult(
  resultId: string,
  gradingData: { isPassed: boolean; grade: number; teacherNotes?: string }
): Promise<OnlineTestResult> {
  const { isPassed, grade, teacherNotes } = gradingData;
  try {
    const result = await sql`
      UPDATE online_test_results
      SET
        is_passed = ${isPassed},
        grade = ${grade},
        teacher_notes = ${teacherNotes || null}
      WHERE id = ${resultId}
      RETURNING id, student_id, online_test_id, score, answers, completed_at, is_passed, grade, teacher_notes, duration_seconds;
    `;
    if (result.rows.length === 0) {
      throw new Error("Online test result not found for grading.");
    }
    const row = result.rows[0];
     return {
      id: row.id,
      studentId: row.student_id,
      onlineTestId: row.online_test_id,
      score: row.score,
      answers: row.answers,
      completedAt: row.completed_at,
      isPassed: row.is_passed,
      grade: row.grade as (2 | 3 | 4 | 5) | null,
      teacherNotes: row.teacher_notes,
      durationSeconds: row.duration_seconds,
    };
  } catch (error) {
    console.error(`[Store] Failed to grade online test result ${resultId}:`, error);
    throw error;
  }
}


export function resetStore() {
  console.warn("[Store] resetStore is a no-op when using a persistent database.");
}
