'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GroupList from './GroupList';
import ChatWindow from './ChatWindow';
import type { ChatGroup } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

export default function ChatClient() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newMessages, setNewMessages] = useState<Record<string, boolean>>({});

  // fetch groups + normalize response
  const loadGroups = async () => {
    setIsLoadingGroups(true);
    try {
      const res = await fetch('/api/chat/groups');
      if (!res.ok) throw new Error('Не удалось загрузить список групп.');
      const data = await res.json();
      // Поддерживаем оба варианта: сервер может вернуть { groups: [...] } или сразу массив
      const groupsArr: ChatGroup[] = Array.isArray(data) ? data : (data.groups ?? data);
      setGroups(groupsArr);
      // сбросим newMessages для групп, которых нет в ответе
      setNewMessages(prev => {
        const next: Record<string, boolean> = {};
        groupsArr.forEach(g => { next[g.id] = prev[g.id] ?? false; });
        return next;
      });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoadingGroups(false);
    }
  };

  useEffect(() => {
    if (user && !authLoading) {
      loadGroups();
    } else if (!user && !authLoading) {
      setIsLoadingGroups(false);
    }
  }, [user, authLoading]);

  // Вызывается при выборе группы — помечаем read на сервере и открываем
  const handleSelectGroup = async (group: ChatGroup) => {
    setSelectedGroup(group);
    // пометить как прочитанное на сервере
    try {
      await fetch(`/api/chat/groups/${encodeURIComponent(group.id)}/mark-read`, { method: 'POST' });
    } catch (err) {
      // игнорируем ошибку пометки — всё равно откроем чат
      console.warn('mark-read failed', err);
    }
    // локально убираем индикацию новых сообщений
    setNewMessages(prev => ({ ...prev, [group.id]: false }));
    // обновим список групп (чтобы синхронизировать last_read_at/has_unread)
    loadGroups();
  };

  const handleGroupDeleted = async (groupId: string) => {
    try {
      const response = await fetch(`/api/chat/groups/${encodeURIComponent(groupId)}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error || 'Не удалось удалить группу');
      }

      toast({
        title: 'Группа удалена',
        description: `Группа была успешно удалена.`,
      });

      // локально удаляем
      setGroups(prev => prev.filter(g => g.id !== groupId));
      setNewMessages(prev => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });

      if (selectedGroup?.id === groupId) {
        setSelectedGroup(null);
      }

      // также передёрнем загрузку списка, чтобы сервер прислал актуальные данные
      loadGroups();
    } catch (err) {
      toast({
        title: 'Ошибка',
        description: (err as Error).message,
        variant: 'destructive',
      });
    }
  };

  if (authLoading || isLoadingGroups) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-8rem)]">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Ошибка</AlertTitle><AlertDescription>{error}</AlertDescription></Alert>;
  }

  if (!user) {
    return <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Доступ запрещен</AlertTitle><AlertDescription>Пожалуйста, войдите, чтобы воспользоваться чатом.</AlertDescription></Alert>;
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 h-[calc(100vh-8rem)] gap-4">
      <div className="md:col-span-1">
        <GroupList
          groups={groups}
          selectedGroup={selectedGroup}
          onSelectGroup={handleSelectGroup}
          onGroupDeleted={handleGroupDeleted}
          isTeacher={user.role === 'teacher'}
          newMessages={newMessages}
        />
      </div>
      <div className="md:col-span-3 h-full">
        <ChatWindow
          selectedGroup={selectedGroup}
          onNewMessage={(groupId) => {
            // поставить бейдж новой темы
            setNewMessages(prev => ({ ...prev, [groupId]: true }));
            // обновить список групп (если нужно)
            loadGroups();
          }}
        />
      </div>
    </div>
  );
}
