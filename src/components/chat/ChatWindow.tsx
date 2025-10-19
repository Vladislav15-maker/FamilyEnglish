// src/components/chat/ChatWindow.tsx
'use client';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Send, Loader2, Users, MessageSquare, MoreHorizontal, Edit, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import type { ChatGroup, Message, User } from '@/lib/types';


interface ChatWindowProps {
  selectedGroup: ChatGroup | null;
  onNewMessage: (groupId: string) => void;
}

export default function ChatWindow({ selectedGroup, onNewMessage }: ChatWindowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [editingMessage, setEditingMessage] = useState<Message | null>(null);
  const [messageToDelete, setMessageToDelete] = useState<Message | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const fetchGroupDetails = useCallback(async () => {
    if (!selectedGroup) return;
    setIsLoading(true);
    try {
      const response = await fetch(`/api/chat/groups/${selectedGroup.id}`);
      if (!response.ok) {
        throw new Error('Не удалось загрузить данные группы.');
      }
      const data = await response.json();
      setMessages(data.messages || []);
      setMembers(data.members || []);
    } catch (err) {
      toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  }, [selectedGroup, toast]);

  useEffect(() => {
    fetchGroupDetails();
  }, [fetchGroupDetails]);
  
    useEffect(() => {
    if (!selectedGroup) return;

    const interval = setInterval(() => {
      fetch(`/api/chat/groups/${selectedGroup.id}`)
        .then(res => res.json())
        .then(data => {
            if (data.messages.length > messages.length) {
                setMessages(data.messages);
                onNewMessage(selectedGroup.id);
            }
        });
    }, 5000); // Poll every 5 seconds

    return () => clearInterval(interval);
  }, [selectedGroup, messages.length, onNewMessage]);


  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
        setTimeout(() => {
             scrollAreaRef.current!.scrollTop = scrollAreaRef.current!.scrollHeight;
        }, 50);
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !selectedGroup) return;
    setIsSending(true);
    try {
        const url = editingMessage ? `/api/chat/messages/${editingMessage.id}` : '/api/chat/messages';
        const method = editingMessage ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ content: newMessage, groupId: selectedGroup.id }),
        });

        if (!response.ok) throw new Error('Не удалось отправить сообщение.');
        
        const returnedMessage: Message = await response.json();
        
        if (editingMessage) {
            setMessages(prev => prev.map(m => m.id === returnedMessage.id ? { ...m, ...returnedMessage, sender_name: user.name, sender_role: user.role } : m));
            setEditingMessage(null);
        } else {
            setMessages(prev => [...prev, returnedMessage]);
        }

        setNewMessage('');
    } catch (err) {
        toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setIsSending(false);
    }
  };
  
  const handleDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const response = await fetch(`/api/chat/messages/${messageToDelete.id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Не удалось удалить сообщение.');
      
      setMessages(prev => prev.filter(m => m.id !== messageToDelete.id));
      toast({title: "Сообщение удалено."});
    } catch (err) {
        toast({ title: 'Ошибка', description: (err as Error).message, variant: 'destructive' });
    } finally {
        setMessageToDelete(null);
    }
  }

  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (!selectedGroup) {
    return (
      <div className="flex flex-col items-center justify-center h-full border rounded-lg bg-card text-muted-foreground">
        <MessageSquare className="h-16 w-16 mb-4" />
        <p className="text-lg">Выберите группу, чтобы начать общение</p>
      </div>
    );
  }

  return (
    <>
    <Card className="h-full flex flex-col shadow-lg">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>{selectedGroup.name}</CardTitle>
          <CardDescription>{members.length} участника(ов)</CardDescription>
        </div>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" size="icon"><Users className="h-4 w-4" /></Button>
          </PopoverTrigger>
          <PopoverContent>
            <h4 className="font-semibold mb-2">Участники</h4>
            <ul className="space-y-2">
              {members.map(member => (
                <li key={member.id} className="flex items-center gap-2">
                  <Avatar className="h-8 w-8"><AvatarFallback>{getInitials(member.name)}</AvatarFallback></Avatar>
                  <span>{member.name} ({member.role === 'teacher' ? 'Учитель' : 'Ученик'})</span>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      </CardHeader>

      <CardContent className="flex-1 flex flex-col p-0">
        <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
            <div className="space-y-6">
              {messages.map((msg) => {
                const isCurrentUser = msg.sender_id === user?.id;
                const isTeacher = msg.sender_role === 'teacher';

                return (
                  <div key={msg.id} className={cn("group flex items-end gap-3", isCurrentUser ? "justify-end" : "")}>
                    {!isCurrentUser && (
                       <Avatar className="h-10 w-10"><AvatarFallback>{getInitials(msg.sender_name)}</AvatarFallback></Avatar>
                    )}
                     {isCurrentUser && (
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="h-6 w-6"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => { setEditingMessage(msg); setNewMessage(msg.content); }}> <Edit className="mr-2 h-4 w-4" />Редактировать </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => setMessageToDelete(msg)} className="text-destructive"> <Trash2 className="mr-2 h-4 w-4" />Удалить </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </div>
                     )}
                    <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3", 
                        isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" 
                            : isTeacher ? "bg-amber-100 dark:bg-amber-800/50 text-amber-900 dark:text-amber-200 rounded-bl-none border border-amber-200 dark:border-amber-700"
                                : "bg-muted rounded-bl-none"
                    )}>
                      {!isCurrentUser && (<p className={cn("font-bold text-sm mb-1", isTeacher ? "text-amber-700 dark:text-amber-300" : "text-primary")}>{msg.sender_name}</p> )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                       <p className="text-xs mt-2 opacity-70 text-right">
                         {msg.updated_at && msg.updated_at !== msg.created_at ? `(изм) ` : ''}
                         {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                     {isCurrentUser && (
                       <Avatar className="h-10 w-10"><AvatarFallback>{getInitials(msg.sender_name)}</AvatarFallback></Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>

      <CardFooter className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="w-full">
           {editingMessage && (
            <div className="text-sm text-muted-foreground p-2 mb-2 bg-muted/50 rounded-md border-l-4 border-primary flex justify-between items-center">
                <span>Редактирование сообщения...</span>
                <Button variant="link" size="sm" type="button" onClick={() => {setEditingMessage(null); setNewMessage('');}}>Отмена</Button>
            </div>
           )}
           <div className="flex w-full items-center gap-2">
             <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Напишите сообщение..."
                className="flex-1"
                autoComplete="off"
                disabled={isSending}
            />
             <Button type="submit" size="icon" disabled={!newMessage.trim() || isSending}>
                {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
             </Button>
           </div>
        </form>
      </CardFooter>
    </Card>
    
    <AlertDialog open={!!messageToDelete} onOpenChange={(open) => !open && setMessageToDelete(null)}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Вы уверены?</AlertDialogTitle><AlertDialogDescription>Это действие необратимо. Сообщение будет удалено навсегда.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel>Отмена</AlertDialogCancel>
                <AlertDialogAction onClick={handleDeleteMessage} className="bg-destructive hover:bg-destructive/90">Удалить</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
