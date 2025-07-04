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
import { AlertCircle, BookOpen, Loader2, Timer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type Attempt = { wordId: string; userAnswer: string; };

export default function OnlineTestTakePage() {
  const params = useParams();
  const router = useRouter();
  const testId = (params.testId || params.testid) as string | undefined;
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [test, setTest] = useState<OnlineTest | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // State flags
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false); // Used ONLY for graceful submission UI
  const [isFinished, setIsFinished] = useState(false); // A flag to prevent any further submissions
  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Use a ref to hold the latest state for the unload handler, preventing stale closures.
  const submissionDataRef = useRef({ test, user, attempts, timeRemaining, isFinished, isSubmitting });
  useEffect(() => {
    submissionDataRef.current = { test, user, attempts, timeRemaining, isFinished, isSubmitting };
  }, [test, user, attempts, timeRemaining, isFinished, isSubmitting]);

  const submitTest = useCallback(async (isUnload = false) => {
    // This is the core submission logic.
    // It can be called gracefully (awaitable) or on unload (fire-and-forget).
    const { 
      test: currentTest, 
      user: currentUser, 
      attempts: currentAttempts, 
      timeRemaining: currentTime
    } = submissionDataRef.current;
    
    if (!currentUser || !currentTest) {
      if (!isUnload) {
        toast({ title: "Ошибка", description: "Недостаточно данных для отправки теста.", variant: "destructive" });
      }
      return;
    }
    
    // Set a flag immediately to prevent duplicate submissions
    setIsFinished(true);

    const allWordsAnswers = currentTest.words.map(word => {
        const attempt = currentAttempts.find(a => a.wordId === word.id);
        return attempt || { wordId: word.id, userAnswer: '' };
    });

    const durationSeconds = currentTest.durationMinutes > 0 ? (currentTest.durationMinutes * 60) - currentTime : 0;
    
    const payload = {
        onlineTestId: currentTest.id,
        answers: allWordsAnswers,
        durationSeconds,
    };

    // For unload, we use keepalive and don't care about the response.
    if (isUnload) {
        fetch('/api/student/online-tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
            keepalive: true,
        });
        return;
    }

    // For graceful submission, we show UI and handle the response.
    setIsSubmitting(true);
    toast({ title: "Завершение теста...", description: "Отправляем ваши ответы на проверку." });

    try {
        const response = await fetch('/api/student/online-tests/submit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error?.message || 'Не удалось отправить тест.');
        }
        
        toast({ title: "Тест отправлен!", description: "Ваши ответы отправлены учителю на проверку." });
        router.push(`/dashboard/student/online-tests`);

    } catch (err) {
        console.error("[OnlineTest] Failed to save result:", err);
        toast({ title: "Ошибка", description: (err as Error).message, variant: "destructive" });
        setIsSubmitting(false); // Allow re-submission on error
        setIsFinished(false); // Reset finish flag on error
    }
  }, [router, toast]);


  // Effect to load initial data
  useEffect(() => {
    if (testId && user) {
      setIsLoading(true);
      fetch('/api/student/online-tests')
        .then(res => {
          if (!res.ok) throw new Error("Не удалось проверить статус теста.");
          return res.json();
        })
        .then((testsWithStatus: (OnlineTest & { lastResult: OnlineTestResult | null })[]) => {
          const currentTestStatus = testsWithStatus.find(t => t.id === testId);
          if (currentTestStatus?.lastResult) {
            setExistingResult(currentTestStatus.lastResult);
            setIsFinished(true); // Mark as finished if there's already a result
          } else {
            const testData = getOnlineTestById(testId);
            if (testData) {
              setTest(testData);
              setShuffledWords([...testData.words].sort(() => Math.random() - 0.5));
              if(testData.durationMinutes > 0) {
                setTimeRemaining(testData.durationMinutes * 60);
              }
            } else {
              setError("Тест с таким ID не найден.");
            }
          }
        })
        .catch(err => {
          console.error("Failed to setup test:", err);
          setError((err as Error).message);
        })
        .finally(() => setIsLoading(false));
    } else if (!user) {
        setIsLoading(false);
    }
  }, [testId, user]);


  // Effect for the timer
  useEffect(() => {
    if (isFinished || isSubmitting || !test || test.durationMinutes <= 0 || existingResult) {
      return;
    }
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          if (!submissionDataRef.current.isFinished) {
            submitTest(false);
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [test, isSubmitting, isFinished, existingResult, submitTest]);


  // Effect for the unload handler (safety net)
  useEffect(() => {
    const handleUnload = () => {
      if (!submissionDataRef.current.isFinished) {
        submitTest(true);
      }
    };
    
    window.addEventListener('pagehide', handleUnload);
    
    return () => {
      window.removeEventListener('pagehide', handleUnload);
    };
  }, [submitTest]); // Dependency on the memoized submitTest

  const handleWordSubmit = (userAnswer: string) => {
    if (!test || !shuffledWords[currentWordIndex] || isFinished) return;

    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
    };
    
    setAttempts(prev => [...prev.filter(a => a.wordId !== newAttempt.wordId), newAttempt]);

    if (currentWordIndex < shuffledWords.length - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // It's the last word, gracefully submit.
      submitTest(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }
  
  if (error) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user) {
     return <Alert variant="default"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите в систему.</AlertDescription></Alert>;
  }

  if (existingResult) {
    const isPending = existingResult.isPassed === null;
    return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
            <Breadcrumb className="w-full max-w-2xl">
              <BreadcrumbList>
                <BreadcrumbItem><Link href="/dashboard/student/online-tests">Онлайн Тесты</Link></BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem><BreadcrumbPage>Тест: {getOnlineTestById(testId || '')?.name}</BreadcrumbPage></BreadcrumbItem>
              </BreadcrumbList>
            </Breadcrumb>
            <Alert className="max-w-md">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Тест уже {isPending ? 'отправлен на проверку' : 'пройден'}</AlertTitle>
                <AlertDescription>
                    Вы уже отправляли этот тест и не можете пройти его снова. 
                    {isPending ? ' Ожидайте результатов проверки от учителя.' : ' Вы можете посмотреть свои результаты.'}
                </AlertDescription>
                <div className="mt-4 flex gap-4">
                    <Button asChild variant="outline">
                        <Link href="/dashboard/student/online-tests">
                           К списку тестов
                        </Link>
                    </Button>
                    {!isPending && existingResult.id && (
                       <Button asChild>
                           <Link href={`/dashboard/student/online-tests/${testId}/result/${existingResult.id}`}>
                               Посмотреть результат
                           </Link>
                       </Button>
                    )}
                </div>
            </Alert>
        </div>
    );
  }
  
  // This UI is shown ONLY during a graceful submission (last word, or timer runs out)
  if (isSubmitting) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)]">
            <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
            <p className="text-xl text-muted-foreground">Отправляем тест на проверку...</p>
        </div>
      )
  }

  if (!test) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Тест не найден</AlertTitle></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = shuffledWords.length > 0 ? ((currentWordIndex) / shuffledWords.length) * 100 : 0;

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
          {test.durationMinutes > 0 && (
            <div className="flex items-center gap-2 font-mono font-semibold text-lg text-destructive">
                <Timer className="h-5 w-5" />
                {formatTime(timeRemaining)}
            </div>
          )}
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
