'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, ChevronRight, RotateCcw } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  showNextButton?: boolean; 
  onNext?: () => void; 
}

function normalizeAnswer(answer: string): string {
  if (typeof answer !== 'string') return '';
  let normalized = answer.trim().toLowerCase();
  
  // Основные сокращения с апострофом
  normalized = normalized.replace(/i'm/g, 'i am');
  normalized = normalized.replace(/you're/g, 'you are');
  normalized = normalized.replace(/he's/g, 'he is');
  normalized = normalized.replace(/she's/g, 'she is');
  normalized = normalized.replace(/it's/g, 'it is');
  normalized = normalized.replace(/we're/g, 'we are');
  normalized = normalized.replace(/they're/g, 'they are');
  normalized = normalized.replace(/what's/g, 'what is');
  normalized = normalized.replace(/let's/g, 'let us');
  normalized = normalized.replace(/who's/g, 'who is'); // Добавлено

  // Сокращения с "n't"
  normalized = normalized.replace(/can't/g, 'cannot');
  normalized = normalized.replace(/won't/g, 'will not');
  normalized = normalized.replace(/isn't/g, 'is not');
  normalized = normalized.replace(/aren't/g, 'are not');
  normalized = normalized.replace(/wasn't/g, 'was not');
  normalized = normalized.replace(/weren't/g, 'were not');
  normalized = normalized.replace(/hasn't/g, 'has not');
  normalized = normalized.replace(/haven't/g, 'have not');
  normalized = normalized.replace(/hadn't/g, 'had not');
  normalized = normalized.replace(/doesn't/g, 'does not');
  normalized = normalized.replace(/don't/g, 'do not');
  normalized = normalized.replace(/didn't/g, 'did not');
  normalized = normalized.replace(/wouldn't/g, 'would not');
  normalized = normalized.replace(/shouldn't/g, 'should not');
  normalized = normalized.replace(/couldn't/g, 'could not');
  
  // Удаление некоторых знаков пунктуации в конце строки, если они не являются частью ответа
  // Это более мягкий подход, чем полное удаление всей пунктуации
  normalized = normalized.replace(/[.,!?;:]+$/, '');

  // Нормализация пробелов
  return normalized.replace(/\s+/g, ' ').trim();
}


export default function WordTestInput({ word, onAnswer, showNextButton = false, onNext }: WordTestInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUserAnswer('');
    setIsSubmitted(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [word]);

  const handleFormSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (isSubmitted) return;

    const normalizedUserAnswer = normalizeAnswer(userAnswer);
    const normalizedCorrectAnswer = normalizeAnswer(word.english);
    
    const correct = normalizedUserAnswer === normalizedCorrectAnswer;
    
    setIsCorrect(correct);
    setIsSubmitted(true);
    onAnswer(correct, userAnswer.trim());
  };

  const handleNextClick = () => {
    if(onNext) {
        onNext();
    }
  };

  const handleRetryInternal = () => {
    setUserAnswer('');
    setIsSubmitted(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Card className="w-full max-w-lg mx-auto shadow-xl">
      <CardHeader className="text-center">
        <CardTitle className="text-3xl font-headline text-primary">Тест: Переведите слово</CardTitle>
        <CardDescription className="text-muted-foreground">Напишите английский перевод для русского слова.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-6 bg-secondary/30 rounded-lg text-center">
          <p className="text-sm text-muted-foreground">Русское слово:</p>
          <p className="text-4xl font-bold text-secondary-foreground font-body my-2">{word.russian}</p>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            ref={inputRef}
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="Введите перевод на английском"
            disabled={isSubmitted}
            className={`text-lg p-4 h-14 ${isSubmitted ? (isCorrect ? 'border-green-500 focus:border-green-500 ring-green-500' : 'border-red-500 focus:border-red-500 ring-red-500') : ''}`}
            aria-label="Поле для ввода перевода"
          />
          {!isSubmitted ? (
            <Button type="submit" className="w-full text-lg py-3" size="lg">
              Проверить
            </Button>
          ) : showNextButton && onNext ? (
            <Button type="button" onClick={handleNextClick} className="w-full text-lg py-3" size="lg">
              Дальше <ChevronRight className="ml-2 h-5 w-5" />
            </Button>
          ) : null }
        </form>

        {isSubmitted && (
          <div className={`p-4 rounded-md text-center ${isCorrect ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
            {isCorrect ? (
              <div className="flex items-center justify-center text-green-700 dark:text-green-300">
                <CheckCircle className="h-8 w-8 mr-3" />
                <p className="text-xl font-semibold">Правильно!</p>
              </div>
            ) : (
              <div className="text-red-700 dark:text-red-300 space-y-2">
                <div className="flex items-center justify-center">
                  <XCircle className="h-8 w-8 mr-3" />
                  <p className="text-xl font-semibold">Неправильно.</p>
                </div>
                <p className="text-md">Ваш ответ: <span className="font-mono">{userAnswer || "(пусто)"}</span></p>
                <p className="text-md">Правильный ответ: <span className="font-semibold font-mono">{word.english}</span></p>
                {!showNextButton && (
                  <Button onClick={handleRetryInternal} variant="outline" size="sm" className="mt-2">
                    <RotateCcw className="mr-2 h-4 w-4" /> Попробовать еще раз
                  </Button>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
