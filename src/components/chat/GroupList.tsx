// src/components/chat/GroupList.tsx
'use client';
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, PlusCircle, Trash2 } from 'lucide-react';
import type { ChatGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';
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

interface GroupListProps {
  groups: ChatGroup[];
  selectedGroup: ChatGroup | null;
  onSelectGroup: (group: ChatGroup) => void;
  onGroupDeleted: (groupId: string) => void;
  isTeacher: boolean;
  newMessages: Record<string, boolean>;
}

export default function GroupList({ groups, selectedGroup, onSelectGroup, onGroupDeleted, isTeacher, newMessages }: GroupListProps) {
  const [groupToDelete, setGroupToDelete] = useState<ChatGroup | null>(null);
  
  return (
    <>
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Группы чата</span>
          {isTeacher && (
             <Button asChild variant="ghost" size="icon">
                <Link href="/dashboard/teacher/groups" title="Управление группами">
                  <PlusCircle className="h-5 w-5" />
                </Link>
            </Button>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 p-2">
        <ScrollArea className="h-full">
          {groups.length === 0 ? (
            <div className="text-center text-muted-foreground p-4">
              <p>Вы еще не состоите ни в одной группе.</p>
              {isTeacher && <p className="mt-2 text-sm">Нажмите "+", чтобы создать новую группу.</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {groups.map(group => (
                <div key={group.id} className="group flex items-center gap-1">
                  <Button
                    variant={selectedGroup?.id === group.id ? 'secondary' : 'ghost'}
                    className="w-full justify-start h-12 flex-1 relative"
                    onClick={() => onSelectGroup(group)}
                  >
                    {newMessages[group.id] && <span className="absolute left-2 top-1/2 -translate-y-1/2 h-2 w-2 rounded-full bg-red-500 animate-pulse"></span>}
                    <Users className="mr-2 h-4 w-4 ml-4" />
                    <span className="truncate">{group.name}</span>
                  </Button>
                  {isTeacher && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={(e) => {
                        e.stopPropagation();
                        setGroupToDelete(group);
                      }}
                      title={`Удалить группу "${group.name}"`}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>

    <AlertDialog open={!!groupToDelete} onOpenChange={(open) => !open && setGroupToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Вы уверены?</AlertDialogTitle>
                <AlertDialogDescription>
                    Это действие необратимо. Группа "{groupToDelete?.name}" и все сообщения в ней будут удалены навсегда.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction 
                  onClick={() => {
                    if (groupToDelete) {
                      onGroupDeleted(groupToDelete.id);
                      setGroupToDelete(null);
                    }
                  }} 
                  className="bg-destructive hover:bg-destructive/90"
                >
                  Удалить
                </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
