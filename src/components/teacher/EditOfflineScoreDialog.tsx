'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { User, OfflineTestScore } from '@/lib/types';
import { OFFLINE_TESTS } from '@/lib/curriculum-data';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Check } from 'lucide-react';

const offlineTestSchema = z.object({
  studentId: z.string(), // Not editable, just for data
  testId: z.string().min(1, "Выберите оффлайн тест"),
  score: z.coerce.number().min(2).max(5),
  passed: z.boolean(),
  notes: z.string().optional(),
});

type OfflineTestFormValues = z.infer<typeof offlineTestSchema>;

interface EditOfflineScoreDialogProps {
  score: OfflineTestScore;
  students: User[];
  isOpen: boolean;
  onClose: () => void;
  onScoreUpdated: () => void;
}

export default function EditOfflineScoreDialog({ score, students, isOpen, onClose, onScoreUpdated }: EditOfflineScoreDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const studentName = students.find(s => s.id === score.studentId)?.name || score.studentId;

  const form = useForm<OfflineTestFormValues>({
    resolver: zodResolver(offlineTestSchema),
    defaultValues: {
      studentId: score.studentId,
      testId: score.testId || '',
      score: score.score,
      notes: score.notes || '',
      passed: score.passed ?? true,
    },
  });

  useEffect(() => {
    form.reset({
      studentId: score.studentId,
      testId: score.testId || '',
      score: score.score,
      notes: score.notes || '',
      passed: score.passed ?? true,
    });
  }, [score, form]);

  const onSubmit = async (data: OfflineTestFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/offline-scores/${score.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      toast({
        title: 'Оценка обновлена',
        description: `Оценка для ученика ${studentName} успешно обновлена.`,
      });
      onScoreUpdated();
    } catch (error) {
      toast({
        title: 'Ошибка обновления',
        description: (error as Error).message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Редактировать оценку</DialogTitle>
          <DialogDescription>
            Измените детали оценки для ученика <span className="font-bold">{studentName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="testId"
              render={({ field }) => (
                <FormItem><FormLabel>Оффлайн Тест</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Выберите тест" /></SelectTrigger></FormControl><SelectContent>{OFFLINE_TESTS.map(test => (<SelectItem key={test.id} value={test.id}>{test.name}</SelectItem>))}</SelectContent></Select><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="score"
              render={({ field }) => (
                <FormItem className="space-y-3"><FormLabel>Оценка</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()} className="flex space-x-4">{[5, 4, 3, 2].map(val => (<FormItem key={val} className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value={val.toString()} /></FormControl><FormLabel className="font-normal text-lg">{val}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="passed"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4"><div className="space-y-0.5"><FormLabel className="text-base">Тест пройден?</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem><FormLabel>Комментарий</FormLabel><FormControl><Textarea placeholder="Добавьте комментарий..." {...field} /></FormControl><FormMessage /></FormItem>
              )}
            />
            <DialogFooter>
              <DialogClose asChild><Button type="button" variant="secondary">Отмена</Button></DialogClose>
              <Button type="submit" disabled={isLoading}>{isLoading ? 'Сохранение...' : 'Сохранить изменения'}</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
