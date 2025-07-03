'use client';
import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordTestInput from '@/components/curriculum/WordTestInput';
import { getOnlineTestById } from '@/lib/curriculum-data';
import type { OnlineTest, Word, OnlineTestResult, AuthenticatedUser } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, ThumbsUp, Repeat, ChevronLeft, Loader2, Timer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// This only tracks the user's raw answer, correctness is determined by the teacher
type Attempt = { wordId: string; userAnswer: string; };

export default function OnlineTestTakePage() {
  const params = useParams();
  const router = useRouter();
  const testId = typeof params.testId === 'string' ? params.testId : '';
  
  const { user } = useAuth();
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const [test, setTest] = useState<OnlineTest | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const stateRef = useRef({
    isTestFinished: false,
    isSubmitting: false,
    attempts: [] as Attempt[],
    timeRemaining: 0,
    test: null as OnlineTest | null,
    user: null as AuthenticatedUser | null,
  });

  useEffect(() => {
    stateRef.current = {
      isTestFinished,
      isSubmitting,
      attempts,
      timeRemaining,
      test,
      user,
    };
  });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  useEffect(() => {
    if (testId && user) {
      setIsLoading(true);
      setError(null);
      setExistingResult(null);

      fetch('/api/student/online-tests')
        .then(res => {
          if (!res.ok) throw new Error("Не удалось проверить статус теста.");
          return res.json();
        })
        .then((testsWithStatus: (OnlineTest & { lastResult: OnlineTestResult | null })[]) => {
          const currentTestStatus = testsWithStatus.find(t => t.id === testId);
          if (currentTestStatus?.lastResult) {
            setExistingResult(currentTestStatus.lastResult);
          } else {
            const testData = getOnlineTestById(testId);
            if (testData) {
              setTest(testData);
              setShuffledWords([...testData.words].sort(() => Math.random() - 0.5));
              setTimeRemaining(testData.durationMinutes * 60);
            } else {
              setError("Тест с таким ID не найден.");
            }
          }
        })
        .catch(err => {
          console.error("Failed to setup test:", err);
          setError((err as Error).message);
        })
        .finally(() => {
          setIsLoading(false);
        });

    } else if (!user) {
        setIsLoading(false);
    }
  }, [testId, user]);

  useEffect(() => {
    if (!test || isTestFinished || existingResult) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    if (timeRemaining > 0) {
      timerRef.current = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);
    } else if (timeRemaining <= 0 && !isTestFinished) {
      if (timerRef.current) clearInterval(timerRef.current);
      handleFinishTest();
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [test, timeRemaining, isTestFinished, existingResult]);

  const submitTest = useCallback((finalAttempts: Attempt[], finalTimeRemaining: number) => {
    if (!user || !test) return;

    setIsSubmitting(true);
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Ensure all words have an attempt, even if empty
    const allWordsAnswers = test.words.map(word => {
        const attempt = finalAttempts.find(a => a.wordId === word.id);
        return attempt || { wordId: word.id, userAnswer: '' };
    });

    const durationSeconds = (test.durationMinutes * 60) - finalTimeRemaining;

    const payload = {
        onlineTestId: test.id,
        answers: allWordsAnswers, // No 'correct' or 'score' field
        durationSeconds,
    };

    fetch('/api/student/online-tests/submit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    .then(async (response) => {
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || 'Не удалось отправить тест на проверку.');
        }
        return response.json();
    })
    .then((savedResult: OnlineTestResult) => {
        toast({ title: "Тест отправлен!", description: `Ваши ответы отправлены учителю на проверку.` });
        router.push(`/dashboard/student/online-tests`);
    })
    .catch((error) => {
        console.error("[OnlineTest] Failed to save result:", error);
        toast({ title: "Ошибка", description: (error as Error).message, variant: "destructive" });
        setIsSubmitting(false); 
        setIsTestFinished(false);
    });
  }, [user, test, router, toast]);

  const handleFinishTest = useCallback(() => {
    setIsTestFinished(true);
    // The submission logic is now centralized in the `submitTest` function,
    // triggered by this `useEffect` when `isTestFinished` becomes true.
  }, []);

  useEffect(() => {
    if (isTestFinished && !isSubmitting) {
      submitTest(attempts, timeRemaining);
    }
  }, [isTestFinished, isSubmitting, attempts, timeRemaining, submitTest]);

  useEffect(() => {
    const handleUnload = () => {
      const { isTestFinished, isSubmitting, test, user, attempts, timeRemaining } = stateRef.current;
      
      if (!isTestFinished && !isSubmitting && test && user) {
        const allWordsAnswers = test.words.map(word => {
            const attempt = attempts.find(a => a.wordId === word.id);
            return attempt || { wordId: word.id, userAnswer: '' };
        });
        const durationSeconds = (test.durationMinutes * 60) - timeRemaining;
        const payload = {
          onlineTestId: test.id,
          answers: allWordsAnswers,
          durationSeconds,
        };
        
        fetch('/api/student/online-tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
      }
    };

    window.addEventListener('beforeunload', handleUnload);
    return () => {
        window.removeEventListener('beforeunload', handleUnload);
        handleUnload(); // Also attempt to save on component unmount (e.g., navigating away)
    };
  }, []);

  const handleWordSubmit = (userAnswer: string) => {
    if (!test || !shuffledWords[currentWordIndex]) return;

    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
    };
    
    // Replace existing attempt for this word, or add a new one.
    setAttempts(prev => {
        const otherAttempts = prev.filter(a => a.wordId !== newAttempt.wordId);
        return [...otherAttempts, newAttempt];
    });

    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      handleFinishTest();
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (error) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user) {
     return <Alert variant="destructive"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите в систему.</AlertDescription></Alert>;
  }

  if (existingResult) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
            <Breadcrumb className="w-full max-w-2xl">
              <BreadcrumbList>
                <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Тест: {getOnlineTestById(testId)?.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Тест уже пройден или проверяется</AlertTitle>
                <AlertDescription>
                    Вы уже прошли этот тест и не можете пройти его снова. Ожидайте результатов проверки.
                </AlertDescription>
                <div className="mt-4 flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/student/online-tests">
                           К списку тестов
                        </Link>
                    </Button>
                </div>
            </Alert>
        </div>
    );
  }

  if (!test) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Тест не найден</AlertTitle></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = shuffledWords.length > 0 ? ((currentWordIndex) / shuffledWords.length) * 100 : 0;

  if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Отправляем тест на проверку...</p>
        </div>
      )
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
       <Breadcrumb className="w-full max-w-2xl">
          <BreadcrumbList>
            <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem><BreadcrumbPage>Тест: {test.name}</BreadcrumbPage></BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">{test.name}</h2>
          <div className="flex items-center gap-2 font-mono font-semibold text-lg text-destructive">
            <Timer className="h-5 w-5" />
            {formatTime(timeRemaining)}
          </div>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" />
      </div>

      {currentWord ? (
        <WordTestInput 
          key={currentWord.id}
          word={currentWord} 
          onSubmitAnswer={handleWordSubmit}
          isLastWord={currentWordIndex === shuffledWords.length - 1}
        />
      ) : (
        <p>Загрузка слова...</p>
      )}
    </div>
  );
}
