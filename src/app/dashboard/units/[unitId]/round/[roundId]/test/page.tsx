'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import WordTestInput from '@/components/curriculum/WordTestInput';
import WordMultipleChoice from '@/components/curriculum/WordMultipleChoice';
import { getRoundById } from '@/lib/curriculum-data';
import type { Round, Word, WordAttempt } from '@/lib/types';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, BookOpen, ThumbsUp, Repeat, ChevronLeft, Loader2, ArrowRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

type TestStage = 'input' | 'choice';

export default function TestRoundPage() {
  const params = useParams();
  const router = useRouter();
  const unitId = typeof params.unitId === 'string' ? params.unitId : '';
  const roundId = typeof params.roundId === 'string' ? params.roundId : '';
  
  const { user } = useAuth();
  const { toast } = useToast();

  const [round, setRound] = useState<Round | null>(null);
  const [shuffledWords, setShuffledWords] = useState<Word[]>([]);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [stage, setStage] = useState<TestStage>('input');

  const [attempts, setAttempts] = useState<WordAttempt[]>([]);
  
  const [isTestFinished, setIsTestFinished] = useState(false);
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (unitId && roundId) {
      const currentRoundData = getRoundById(unitId, roundId);
      setRound(currentRoundData);
      if (currentRoundData) {
        setShuffledWords([...currentRoundData.words].sort(() => Math.random() - 0.5));
      }
      setIsLoading(false);
    }
  }, [unitId, roundId]);

  const totalWords = shuffledWords.length;

  const calculateScore = useCallback((finalAttempts: WordAttempt[]) => {
    if (totalWords === 0) return 0;
    const correctAnswers = finalAttempts.reduce((count, attempt) => {
        return count + (attempt.writtenCorrect ? 1 : 0) + (attempt.choiceCorrect ? 1 : 0);
    }, 0);
    const totalPossibleCorrect = totalWords * 2; // Each word has two questions
    return Math.round((correctAnswers / totalPossibleCorrect) * 100);
  }, [totalWords]);

  useEffect(() => {
    if (isTestFinished && user && round) {
      setIsSubmitting(true);
      
      const finalScoreValue = calculateScore(attempts);
      setScore(finalScoreValue);

      const progressPayload = {
        unitId,
        roundId,
        score: finalScoreValue,
        attempts,
        completed: true,
        timestamp: Date.now(),
      };

      fetch('/api/progress/round', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(progressPayload),
      })
      .then(async (response) => {
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown server error." }));
          throw new Error(errorData.error || `Server responded with status: ${response.status}`);
        }
        return response.json();
      })
      .then(() => {
        toast({
          title: "Тест завершен!",
          description: `Ваш результат: ${finalScoreValue}%. Прогресс сохранен.`,
        });
      })
      .catch((error) => {
        console.error("[TestRoundPage] Failed to save progress via API:", error);
        toast({
          title: "Ошибка сохранения",
          description: (error as Error).message || "Не удалось сохранить ваш прогресс.",
          variant: "destructive"
        });
      })
      .finally(() => {
        setIsSubmitting(false);
      });
    }
  }, [isTestFinished, user, round, attempts, calculateScore, roundId, unitId, toast]);

  const handleWrittenAnswerSubmit = (isCorrect: boolean, userAnswer: string) => {
    const newAttempt: WordAttempt = {
      wordId: shuffledWords[currentWordIndex].id,
      writtenAnswer: userAnswer,
      writtenCorrect: isCorrect,
    };
    setAttempts(prev => [...prev, newAttempt]);
    // The `onNext` in WordTestInput will handle moving to the next word.
  };

  const proceedToNextWritten = () => {
     if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // Last written answer submitted, move to choice stage
      setCurrentWordIndex(0);
      setStage('choice');
    }
  }

  const handleChoiceAnswerSubmit = (isCorrect: boolean, chosenAnswer: string) => {
    const wordIdToUpdate = shuffledWords[currentWordIndex].id;
    setAttempts(prev => prev.map(attempt => 
        attempt.wordId === wordIdToUpdate
            ? { ...attempt, choiceAnswer: chosenAnswer, choiceCorrect: isCorrect }
            : attempt
    ));

    if (currentWordIndex < totalWords - 1) {
      setCurrentWordIndex(prev => prev + 1);
    } else {
      // Last choice submitted, finish the test
      setIsTestFinished(true);
    }
  };

  const handleRetryTest = () => {
    setCurrentWordIndex(0);
    setAttempts([]);
    setIsTestFinished(false);
    setScore(0);
    setStage('input');
    if (round) {
      setShuffledWords([...round.words].sort(() => Math.random() - 0.5));
    }
  };

  const multipleChoiceOptions = useMemo(() => {
    if (!round || shuffledWords.length === 0) return [];
    const currentWord = shuffledWords[currentWordIndex];
    // Use original, non-shuffled word list for distractors to ensure variety
    const otherWords = round.words.filter(w => w.id !== currentWord.id);
    const shuffledOtherWords = otherWords.sort(() => 0.5 - Math.random());
    const finalOptions = [currentWord, ...shuffledOtherWords.slice(0, 2)];
    return finalOptions.sort(() => 0.5 - Math.random());
  }, [round, shuffledWords, currentWordIndex]);


  if (isLoading) {
    return <div className="flex justify-center items-center h-64"><Loader2 className="animate-spin h-8 w-8 text-primary" /></div>;
  }

  if (!round) {
     return <Alert variant="destructive" className="max-w-xl mx-auto"><AlertCircle className="h-4 w-4" /><AlertTitle>Раунд не найден</AlertTitle><AlertDescription>Запрашиваемый раунд не существует. <Link href={`/dashboard/units/${unitId}`} className="underline">Вернуться к юниту.</Link></AlertDescription></Alert>;
  }

  if (!user || user.role !== 'student') {
     return <Alert variant="destructive" className="max-w-xl mx-auto"><BookOpen className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Эта страница доступна только для учеников.</AlertDescription></Alert>;
  }

  const currentWord: Word | undefined = shuffledWords[currentWordIndex];
  const progressPercentage = totalWords > 0 ? ((currentWordIndex) / totalWords) * 100 : 0;
  
  const stageName = stage === 'input' ? "Этап 1: Перевод" : "Этап 2: Выбор";
  const stageDescription = stage === 'input' ? "Напишите английский перевод" : "Выберите правильный перевод";

  if (isTestFinished) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
        <Card className="w-full max-w-md text-center shadow-xl">
          <CardHeader>
            <div className="mx-auto mb-4 p-3 bg-green-100 dark:bg-green-800 rounded-full inline-block">
                <ThumbsUp className="h-12 w-12 text-green-600 dark:text-green-400" />
            </div>
            <CardTitle className="text-3xl font-headline">Тест завершен!</CardTitle>
            <CardDescription>Отличная работа!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isSubmitting ? (
              <div className="flex items-center justify-center text-sm text-muted-foreground mt-2"><Loader2 className="mr-2 h-4 w-4 animate-spin"/>Сохранение результатов...</div>
            ) : (
              <>
                <p className="text-5xl font-bold text-primary">{score}%</p>
                <p className="text-muted-foreground">Вы набрали {attempts.reduce((acc, a) => acc + (a.writtenCorrect ? 1:0) + (a.choiceCorrect ? 1:0), 0)} из {totalWords * 2} очков.</p>
              </>
            )}
            <div className="flex gap-4 justify-center mt-6">
              <Button onClick={handleRetryTest} variant="outline" size="lg" disabled={isSubmitting}><Repeat className="mr-2 h-5 w-5" />Повторить</Button>
              <Button onClick={() => router.push(`/dashboard/units/${unitId}`)} size="lg" disabled={isSubmitting}>К юниту<ArrowRight className="ml-2 h-5 w-5" /></Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-12rem)] space-y-6 p-4">
       <Breadcrumb className="w-full max-w-2xl">
        <BreadcrumbList>
          <BreadcrumbItem><BreadcrumbLink asChild><Link href="/dashboard/units">Юниты</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbLink asChild><Link href={`/dashboard/units/${unitId}`}>{round?.name || unitId}</Link></BreadcrumbLink></BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem><BreadcrumbPage>Тест: {round.name}</BreadcrumbPage></BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      <div className="w-full max-w-lg">
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-xl font-semibold text-primary">{round.name} - {stageName}</h2>
          <span className="text-sm text-muted-foreground">Слово {currentWordIndex + 1} из {totalWords}</span>
        </div>
        <Progress value={progressPercentage} className="w-full h-2 mb-6" aria-label={`Прогресс теста: ${Math.round(progressPercentage)}%`} />
      </div>

      {currentWord && stage === 'input' && (
        <WordTestInput 
          key={`${currentWord.id}-input`}
          word={currentWord} 
          onAnswer={handleWrittenAnswerSubmit}
          onNext={proceedToNextWritten}
        />
      )}
      {currentWord && stage === 'choice' && (
        <WordMultipleChoice
            key={`${currentWord.id}-choice`}
            word={currentWord}
            options={multipleChoiceOptions}
            onAnswer={handleChoiceAnswerSubmit}
        />
      )}
      {!currentWord && <p>Загрузка слова...</p>}

      <Button variant="link" onClick={() => router.push(`/dashboard/units/${unitId}`)} className="mt-4 text-primary"><ChevronLeft className="mr-1 h-4 w-4" /> Вернуться к раундам юнита</Button>
    </div>
  );
}
