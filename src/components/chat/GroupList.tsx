// src/components/chat/GroupList.tsx
'use client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, PlusCircle } from 'lucide-react';
import type { ChatGroup } from '@/lib/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface GroupListProps {
  groups: ChatGroup[];
  selectedGroup: ChatGroup | null;
  onSelectGroup: (group: ChatGroup) => void;
  isTeacher: boolean;
}

export default function GroupList({ groups, selectedGroup, onSelectGroup, isTeacher }: GroupListProps) {
  return (
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
                <Button
                  key={group.id}
                  variant={selectedGroup?.id === group.id ? 'secondary' : 'ghost'}
                  className="w-full justify-start h-12"
                  onClick={() => onSelectGroup(group)}
                >
                  <Users className="mr-2 h-4 w-4" />
                  <span className="truncate">{group.name}</span>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
