'use client';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import type { StudentUnitGrade } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';

const unitGradeSchema = z.object({
  grade: z.coerce.number().min(2).max(5),
  notes: z.string().optional(),
});

type UnitGradeFormValues = z.infer<typeof unitGradeSchema>;

interface EditUnitGradeDialogProps {
  grade: StudentUnitGrade;
  isOpen: boolean;
  onClose: () => void;
  onGradeUpdated: () => void;
}

export default function EditUnitGradeDialog({ grade, isOpen, onClose, onGradeUpdated }: EditUnitGradeDialogProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<UnitGradeFormValues>({
    resolver: zodResolver(unitGradeSchema),
    defaultValues: {
      grade: grade.grade,
      notes: grade.notes || '',
    },
  });

  useEffect(() => {
    form.reset({
      grade: grade.grade,
      notes: grade.notes || '',
    });
  }, [grade, form]);

  const onSubmit = async (data: UnitGradeFormValues) => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/teacher/unit-grades/${grade.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Ошибка сервера: ${response.status}`);
      }

      toast({
        title: 'Оценка за юнит обновлена',
        description: `Оценка для ученика ${grade.studentName} успешно обновлена.`,
      });
      onGradeUpdated();
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
          <DialogTitle>Редактировать оценку за юнит</DialogTitle>
          <DialogDescription>
            Измените оценку для ученика <span className="font-bold">{grade.studentName}</span> по юниту <span className="font-bold">{grade.unitName}</span>.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            <FormField
              control={form.control}
              name="grade"
              render={({ field }) => (
                <FormItem className="space-y-3"><FormLabel>Оценка</FormLabel><FormControl><RadioGroup onValueChange={(value) => field.onChange(Number(value))} value={field.value.toString()} className="flex space-x-4">{[5, 4, 3, 2].map(val => (<FormItem key={val} className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value={val.toString()} /></FormControl><FormLabel className="font-normal text-lg">{val}</FormLabel></FormItem>))}</RadioGroup></FormControl><FormMessage /></FormItem>
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
