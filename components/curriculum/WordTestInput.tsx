'use client';

import { useState, useEffect, useRef } from 'react';
import type { Word } from '@/lib/types';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, XCircle, ChevronRight, RotateCcw, Eye, EyeOff } from 'lucide-react';

interface WordTestInputProps {
  word: Word;
  onAnswer: (isCorrect: boolean, userAnswer: string) => void;
  showNextButton?: boolean; 
  onNext?: () => void; 
}

function normalizeAnswer(answer: string): string {
  if (typeof answer !== 'string') return '';
  let normalized = answer.trim().toLowerCase();
  
  // apostrophe normalization to standard apostrophe
  normalized = normalized.replace(/[`’]/g, "'");

  // Common contractions to full forms
  normalized = normalized.replace(/\bi'm\b/g, 'i am');
  normalized = normalized.replace(/\byou're\b/g, 'you are');
  normalized = normalized.replace(/\bhe's\b/g, 'he is');
  normalized = normalized.replace(/\bshe's\b/g, 'she is');
  normalized = normalized.replace(/\bit's\b/g, 'it is'); // Differentiate from possessive "its"
  normalized = normalized.replace(/\bwe're\b/g, 'we are');
  normalized = normalized.replace(/\bthey're\b/g, 'they are');
  
  normalized = normalized.replace(/\bwhat's\b/g, 'what is');
  normalized = normalized.replace(/\bwho's\b/g, 'who is'); // Differentiate from possessive "whose"
  normalized = normalized.replace(/\bwhere's\b/g, 'where is');
  normalized = normalized.replace(/\bwhen's\b/g, 'when is');
  normalized = normalized.replace(/\bwhy's\b/g, 'why is');
  normalized = normalized.replace(/\bhow's\b/g, 'how is');
  
  normalized = normalized.replace(/\blet's\b/g, 'let us');

  normalized = normalized.replace(/\bi've\b/g, 'i have');
  normalized = normalized.replace(/\byou've\b/g, 'you have');
  normalized = normalized.replace(/\bwe've\b/g, 'we have');
  normalized = normalized.replace(/\bthey've\b/g, 'they have');
  
  normalized = normalized.replace(/\bi'll\b/g, 'i will');
  normalized = normalized.replace(/\byou'll\b/g, 'you will');
  normalized = normalized.replace(/\bhe'll\b/g, 'he will');
  normalized = normalized.replace(/\bshe'll\b/g, 'she will');
  normalized = normalized.replace(/\bwe'll\b/g, 'we will');
  normalized = normalized.replace(/\bthey'll\b/g, 'they will');

  normalized = normalized.replace(/\bi'd\b/g, 'i would'); // Could also be "i had" - context dependent, but "i would" is common
  normalized = normalized.replace(/\byou'd\b/g, 'you would');
  // ... and so on for he'd, she'd, we'd, they'd

  // Negative contractions
  normalized = normalized.replace(/\bcan't\b/g, 'cannot'); // "can not" is also possible but "cannot" is more standard for one word
  normalized = normalized.replace(/\bwon't\b/g, 'will not');
  normalized = normalized.replace(/\bisn't\b/g, 'is not');
  normalized = normalized.replace(/\baren't\b/g, 'are not');
  normalized = normalized.replace(/\bwasn't\b/g, 'was not');
  normalized = normalized.replace(/\bweren't\b/g, 'were not');
  normalized = normalized.replace(/\bhasn't\b/g, 'has not');
  normalized = normalized.replace(/\bhaven't\b/g, 'have not');
  normalized = normalized.replace(/\bhadn't\b/g, 'had not');
  normalized = normalized.replace(/\bdoesn't\b/g, 'does not');
  normalized = normalized.replace(/\bdon't\b/g, 'do not');
  normalized = normalized.replace(/\bdidn't\b/g, 'did not');
  normalized = normalized.replace(/\bwouldn't\b/g, 'would not');
  normalized = normalized.replace(/\bshouldn't\b/g, 'should not');
  normalized = normalized.replace(/\bcouldn't\b/g, 'could not');
  normalized = normalized.replace(/\bmightn't\b/g, 'might not');
  normalized = normalized.replace(/\bmustn't\b/g, 'must not');
  
  // Remove punctuation that's typically not part of the core answer (.,!?;:) at the end.
  // Be careful not to remove punctuation that might be part of the answer itself.
  normalized = normalized.replace(/[.,!?;:]+$/, '');

  // Normalize multiple spaces to a single space
  return normalized.replace(/\s+/g, ' ').trim();
}


export default function WordTestInput({ word, onAnswer, showNextButton = false, onNext }: WordTestInputProps) {
  const [userAnswer, setUserAnswer] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [isAnswerVisible, setIsAnswerVisible] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uniqueId = `word-input-${word.id}`;

  useEffect(() => {
    setUserAnswer('');
    setIsSubmitted(false);
    setIsAnswerVisible(false);
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
    setIsAnswerVisible(true);
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
    setIsAnswerVisible(false);
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
           <div className="relative">
            <Input
              ref={inputRef}
              id={uniqueId}
              name={uniqueId}
              type={isAnswerVisible ? 'text' : 'password'}
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Введите перевод на английском"
              disabled={isSubmitted}
              className={`text-lg p-4 h-14 pr-12 ${isSubmitted ? (isCorrect ? 'border-green-500 focus:border-green-500 ring-green-500' : 'border-red-500 focus:border-red-500 ring-red-500') : ''}`}
              aria-label="Поле для ввода перевода"
            />
            {!isSubmitted && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 text-muted-foreground"
                onClick={() => setIsAnswerVisible(prev => !prev)}
                aria-label={isAnswerVisible ? "Скрыть ответ" : "Показать ответ"}
              >
                {isAnswerVisible ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            )}
          </div>
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
