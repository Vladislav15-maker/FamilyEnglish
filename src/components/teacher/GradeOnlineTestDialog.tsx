'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { OnlineTestResult } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const gradingSchema = z.object({
  grade: z.coerce.number().min(2).max(5),
  isPassed: z.boolean(),
  teacherNotes: z.string().optional(),
});

type GradingFormValues = z.infer<typeof gradingSchema>;

interface GradeOnlineTestDialogProps {
  result: OnlineTestResult & { studentName: string };
  isOpen: boolean;
  onClose: () => void;
  onGraded: () => void;
}

export default function GradeOnlineTestDialog({ result, isOpen, onClose, onGraded }: GradeOnlineTestDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<GradingFormValues>({
    resolver: zodResolver(gradingSchema),
    defaultValues: {
      grade: result.grade || undefined,
      isPassed: result.isPassed ?? true,
      teacherNotes: result.teacherNotes || '',
    },
  });

  useEffect(() => {
    form.reset({
      grade: result.grade || undefined,
      isPassed: result.isPassed ?? true,
      teacherNotes: result.teacherNotes || '',
    });
  }, [result, form]);

  const onSubmit = async (data: GradingFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher/online-tests/results/${result.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error('Не удалось сохранить оценку.');
      }
      toast({ title: 'Успех', description: `Оценка для ученика ${result.studentName} сохранена.` });
      onGraded();
    } catch (error) {
      toast({ title: 'Ошибка', description: (error as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Оценить Онлайн Тест</DialogTitle>
          <DialogDescription>
            Выставьте оценку для <span className="font-bold">{result.studentName}</span>. Его результат {result.score}%.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem className="space-y-3"><FormLabel>Итоговая оценка</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(Number(value))} value={field.value?.toString()} className="flex space-x-4">{[5, 4, 3, 2].map(val => (<FormItem key={val} className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value={val.toString()} /></FormControl><FormLabel className="font-normal text-lg">{val}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="isPassed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Тест сдан?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="teacherNotes"
              render={({ field }) => (
                <FormItem><FormLabel>Комментарий (необязательно)</FormLabel><FormControl><Textarea placeholder="Добавьте комментарий..." {...field} value={field.value ?? ''} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Отмена</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? <Loader2 className="animate-spin" /> : 'Сохранить'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
