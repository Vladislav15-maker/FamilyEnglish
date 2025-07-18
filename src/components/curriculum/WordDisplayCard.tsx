'use client';
import { useState, useEffect } from 'react';
import type { Word } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, BookCopy, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';
import { generateWordImage } from '@/ai/flows/generate-word-image-flow';
import { Skeleton } from '@/components/ui/skeleton';

interface WordDisplayCardProps {
  word: Word;
}

export default function WordDisplayCard({ word }: WordDisplayCardProps) {
  const { toast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [isLoadingImage, setIsLoadingImage] = useState(true);

  useEffect(() => {
    let isCancelled = false;
    const fetchImage = async () => {
      setIsLoadingImage(true);
      try {
        const generatedImageUrl = await generateWordImage(word.english);
        if (!isCancelled) {
          setImageUrl(generatedImageUrl);
        }
      } catch (error) {
        console.error("Failed to generate image:", error);
        if (!isCancelled) {
          setImageUrl(null); // Or a fallback image URL
        }
      } finally {
        if (!isCancelled) {
          setIsLoadingImage(false);
        }
      }
    };

    fetchImage();

    return () => {
      isCancelled = true;
    };
  }, [word]);

  const handlePlayAudio = () => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(word.english);
      utterance.lang = 'en-US'; 
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Аудио не поддерживается",
        description: "Ваш браузер не поддерживает воспроизведение аудио.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-xl">
       <CardHeader className="p-0">
        <div className="relative aspect-[4/3] w-full bg-muted rounded-t-lg">
          {isLoadingImage ? (
            <div className="flex flex-col items-center justify-center h-full">
              <ImageIcon className="h-16 w-16 text-muted-foreground animate-pulse" />
              <p className="text-sm text-muted-foreground mt-2">Генерируем изображение...</p>
            </div>
          ) : imageUrl ? (
            <Image
              src={imageUrl}
              alt={word.english}
              fill
              className="object-cover rounded-t-lg"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
             <div className="flex flex-col items-center justify-center h-full">
                <p className="text-sm text-destructive">Не удалось загрузить изображение.</p>
             </div>
          )}
        </div>
        <div className="p-6 text-center">
            <CardTitle className="text-4xl font-headline text-primary tracking-wide">
              {word.english}
            </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 text-center pt-0">
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground font-body">Русский перевод:</p>
          <p className="text-2xl font-semibold text-secondary-foreground font-body">{word.russian}</p>
        </div>
        
        <div className="p-4 bg-secondary/50 rounded-lg">
          <p className="text-sm text-muted-foreground font-body">Транскрипция (RU):</p>
          <p className="text-xl italic text-secondary-foreground font-body flex items-center justify-center">
            <BookCopy className="w-5 h-5 mr-2 text-primary" />
            [{word.transcription}]
          </p>
        </div>

        <Button 
          onClick={handlePlayAudio} 
          variant="outline" 
          className="w-full text-lg py-3 group hover:bg-accent hover:text-accent-foreground transition-colors"
          aria-label={`Прослушать слово ${word.english}`}
        >
          <Volume2 className="mr-2 h-6 w-6 group-hover:animate-pulse" />
          Прослушать
        </Button>
      </CardContent>
    </Card>
  );
}

