// src/components/chat/ChatClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Loader2, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import GroupList from './GroupList';
import ChatWindow from './ChatWindow';
import type { ChatGroup } from '@/lib/types';

export default function ChatClient() {
  const { user, isLoading: authLoading } = useAuth();
  const [groups, setGroups] = useState<ChatGroup[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<ChatGroup | null>(null);
  const [isLoadingGroups, setIsLoadingGroups] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (user && !authLoading) {
      fetch('/api/chat/groups')
        .then(res => {
          if (!res.ok) throw new Error('Не удалось загрузить список групп.');
          return res.json();
        })
        .then(data => {
          setGroups(data);
        })
        .catch(err => setError((err as Error).message))
        .finally(() => setIsLoadingGroups(false));
    } else if (!user && !authLoading) {
        setIsLoadingGroups(false);
    }
  }, [user, authLoading]);

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
          onSelectGroup={setSelectedGroup}
          isTeacher={user.role === 'teacher'}
        />
      </div>
      <div className="md:col-span-3 h-full">
        <ChatWindow selectedGroup={selectedGroup} />
      </div>
    </div>
  );
}
