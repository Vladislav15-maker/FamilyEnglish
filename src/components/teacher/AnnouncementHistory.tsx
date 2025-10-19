// components/teacher/AnnouncementHistory.tsx
'use client';
import { useEffect, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { History, Trash2, AlertCircle, Bell } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Announcement {
  id: number;
  content: string;
  is_special: boolean;
  created_at: string;
}

interface AnnouncementHistoryProps {
  refreshKey: boolean;
}

export default function AnnouncementHistory({ refreshKey }: AnnouncementHistoryProps) {
  const [history, setHistory] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [announcementToDelete, setAnnouncementToDelete] = useState<Announcement | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    const fetchHistory = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/teacher/announcements');
        if (!response.ok) {
          throw new Error('Не удалось загрузить историю объявлений.');
        }
        const data: Announcement[] = await response.json();
        setHistory(data);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setIsLoading(false);
      }
    };
    fetchHistory();
  }, [refreshKey]);

  const handleDelete = async () => {
    if (!announcementToDelete) return;
    try {
      const response = await fetch(`/api/teacher/announcements/${announcementToDelete.id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Не удалось удалить объявление.');
      }
      toast({ title: 'Успех', description: 'Объявление удалено.' });
      setHistory(prev => prev.filter(item => item.id !== announcementToDelete.id));
      setAnnouncementToDelete(null);
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    }
  };
  
  return (
    <>
      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center">
            <History className="mr-2 h-6 w-6" />
            История Объявлений
          </CardTitle>
          <CardDescription>
            Список всех созданных объявлений.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Ошибка</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : history.length === 0 ? (
            <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Нет объявлений</AlertTitle>
                <AlertDescription>Вы еще не создали ни одного объявления.</AlertDescription>
            </Alert>
          ) : (
            <div className="max-h-60 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Объявление</TableHead>
                    <TableHead>Дата</TableHead>
                    <TableHead className="text-right">Действие</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {history.map((ann) => (
                    <TableRow key={ann.id}>
                      <TableCell className="font-medium max-w-xs truncate">
                        {ann.is_special && <Badge variant="destructive" className="mr-2"><Bell className="h-3 w-3" /></Badge>}
                        {ann.content}
                      </TableCell>
                      <TableCell>
                        {format(new Date(ann.created_at), 'dd.MM.yyyy HH:mm', { locale: ru })}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setAnnouncementToDelete(ann)}
                          className="h-8 w-8 text-destructive/70 hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      <AlertDialog open={!!announcementToDelete} onOpenChange={(open) => !open && setAnnouncementToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
            <AlertDialogDescription>
              Это действие нельзя будет отменить. Объявление "{announcementToDelete?.content.substring(0, 30)}..." будет удалено.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Отмена</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
              Удалить
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
