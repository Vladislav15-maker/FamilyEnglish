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
import { AlertCircle, BookOpen, Loader2, Timer, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

// This only tracks the user's raw answer. Correctness is determined later by the teacher.
type Attempt = { wordId: string; userAnswer: string; };

export default function OnlineTestTakePage() {
  const params = useParams();
  const router = useRouter();
  const testId = typeof params.testId === 'string' ? params.testId : '';
  
  const { user } = useAuth();
  const { toast } = useToast();
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isSubmittingRef = useRef(false); // Use ref to avoid stale state in closures

  const [test, setTest] = useState<OnlineTest | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  const [timeRemaining, setTimeRemaining] = useState(0);

  const [existingResult, setExistingResult] = useState<OnlineTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const submitTest = useCallback((finalAttempts: Attempt[], finalTimeRemaining: number) => {
    if (!user || !test || isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    
    setIsTestFinished(true); // This will trigger the loading overlay
    if (timerRef.current) clearInterval(timerRef.current);
    
    // Ensure all words have an attempt, even if empty
    const allWordsAnswers = test.words.map(word => {
        const attempt = finalAttempts.find(a => a.wordId === word.id);
        return attempt || { wordId: word.id, userAnswer: '' };
    });

    const durationSeconds = test.durationMinutes > 0 ? (test.durationMinutes * 60) - finalTimeRemaining : 0;

    const payload = {
        onlineTestId: test.id,
        answers: allWordsAnswers,
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
            const errorMessage = (errorData.error?.message || typeof errorData.error === 'string' ? errorData.error : null) || 'Не удалось отправить тест на проверку.';
            throw new Error(errorMessage);
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
        setIsTestFinished(false); // Allow resubmission
        isSubmittingRef.current = false;
    });
  }, [user, test, router, toast]);

  const handleFinishTest = useCallback(() => {
    submitTest(attempts, timeRemaining);
  }, [attempts, timeRemaining, submitTest]);

  // Effect for setting up the test and timer
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

  // Effect for timer
  useEffect(() => {
    if (!test || test.durationMinutes <= 0 || isTestFinished || existingResult) {
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
  }, [test, timeRemaining, isTestFinished, existingResult, handleFinishTest]);

  // Effect for handling page exit
   useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden' && test && user && !isTestFinished && !isSubmittingRef.current) {
          const allWordsAnswers = test.words.map(word => {
              const attempt = attempts.find(a => a.wordId === word.id);
              return attempt || { wordId: word.id, userAnswer: '' };
          });
          const durationSeconds = test.durationMinutes > 0 ? (test.durationMinutes * 60) - timeRemaining : 0;
          const payload = {
            onlineTestId: test.id,
            answers: allWordsAnswers,
            durationSeconds,
          };
          
          const blob = new Blob([JSON.stringify(payload)], { type: 'application/json; charset=UTF-8' });
          navigator.sendBeacon('/api/student/online-tests/submit', blob);
          isSubmittingRef.current = true;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [test, user, isTestFinished, attempts, timeRemaining]);


  const handleWordSubmit = (userAnswer: string) => {
    if (!test || !shuffledWords[currentWordIndex]) return;

    const newAttempt: Attempt = {
      wordId: shuffledWords[currentWordIndex].id,
      userAnswer,
    };
    
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
    const isPending = existingResult.isPassed === null;
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
                    {!isPending && (
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

  if (!test) {
     return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Тест не найден</AlertTitle></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = shuffledWords.length > 0 ? ((currentWordIndex) / shuffledWords.length) * 100 : 0;

  if (isTestFinished) {
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
