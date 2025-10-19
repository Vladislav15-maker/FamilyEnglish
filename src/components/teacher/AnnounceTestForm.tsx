// components/teacher/AnnounceTestForm.tsx
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Bell } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Switch } from '../ui/switch';

const FormSchema = z.object({
  content: z.string().min(1, 'Текст объявления не может быть пустым.').max(500, 'Максимальная длина 500 символов.'),
  isSpecial: z.boolean().default(false),
});

interface AnnounceTestFormProps {
  onAnnouncementAdded: () => void;
}

export default function AnnounceTestForm({ onAnnouncementAdded }: AnnounceTestFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      content: '',
      isSpecial: false,
    }
  });

  async function onSubmit(data: z.infer<typeof FormSchema>) {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/teacher/announcements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Не удалось сохранить объявление');
      }

      toast({
        title: 'Успех!',
        description: 'Объявление успешно создано и будет видно ученикам.',
      });
      form.reset({ content: '', isSpecial: false });
      onAnnouncementAdded();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center">
            <Bell className="mr-2 h-6 w-6"/>
            Создать объявление
        </CardTitle>
        <CardDescription>
          Создайте оповещение для всех учеников.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                  <FormItem>
                      <FormLabel>Текст объявления</FormLabel>
                      <FormControl>
                          <Textarea placeholder="Например, 'Внимание, завтрашний урок отменен.'" {...field} rows={4} />
                      </FormControl>
                      <FormMessage />
                  </FormItem>
              )}
            />
            <FormField
                control={form.control}
                name="isSpecial"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <FormLabel className="text-base">Особое событие?</FormLabel>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            <Button type="submit" disabled={isLoading} className="w-full h-10">
              {isLoading ? <Loader2 className="animate-spin" /> : 'Опубликовать'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
