// src/app/dashboard/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Send, MessageSquare, Loader2, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface Message {
  id: number;
  sender_id: string;
  sender_name: string;
  sender_role: 'teacher' | 'student';
  content: string;
  created_at: string;
}

export default function ChatPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!authLoading && user) {
      fetchMessages();
    } else if (!authLoading && !user) {
        setIsLoading(false);
    }
  }, [user, authLoading]);

  const fetchMessages = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/chat/messages');
      if (!response.ok) {
        throw new Error('Не удалось загрузить сообщения.');
      }
      const data: Message[] = await response.json();
      setMessages(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    setIsSending(true);
    try {
      const response = await fetch('/api/chat/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newMessage }),
      });

      if (!response.ok) {
        throw new Error('Не удалось отправить сообщение.');
      }

      const sentMessage: Message = await response.json();
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSending(false);
    }
  };
  
  const getInitials = (name: string | undefined) => {
    if (!name) return 'U';
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[names.length - 1][0]}`.toUpperCase() : name.substring(0, 2).toUpperCase();
  };

  if (authLoading || isLoading) {
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
    <div className="h-[calc(100vh-8rem)] flex flex-col">
       <div className="flex items-center space-x-3 mb-6">
        <MessageSquare className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Общий чат</h1>
      </div>
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader>
          <CardTitle>Общий чат класса</CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            <div className="space-y-6">
              {messages.map((msg) => {
                const isCurrentUser = msg.sender_id === user.id;
                const isTeacher = msg.sender_role === 'teacher';

                return (
                  <div key={msg.id} className={cn("flex items-end gap-3", isCurrentUser && "justify-end")}>
                    {!isCurrentUser && (
                       <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(msg.sender_name)}`} data-ai-hint="profile person" />
                        <AvatarFallback>{getInitials(msg.sender_name)}</AvatarFallback>
                      </Avatar>
                    )}
                    <div className={cn("max-w-xs md:max-w-md lg:max-w-lg rounded-2xl px-4 py-3", 
                        isCurrentUser 
                            ? "bg-primary text-primary-foreground rounded-br-none" 
                            : isTeacher
                                ? "bg-amber-100 dark:bg-amber-800/50 text-amber-900 dark:text-amber-200 rounded-bl-none border border-amber-200 dark:border-amber-700"
                                : "bg-muted rounded-bl-none"
                    )}>
                      {!isCurrentUser && (
                         <p className={cn("font-bold text-sm mb-1", isTeacher ? "text-amber-700 dark:text-amber-300" : "text-primary")}>{msg.sender_name}</p>
                      )}
                      <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                       <p className="text-xs mt-2 opacity-70 text-right">
                        {format(new Date(msg.created_at), 'HH:mm')}
                      </p>
                    </div>
                     {isCurrentUser && (
                       <Avatar className="h-10 w-10">
                        <AvatarImage src={`https://placehold.co/100x100.png?text=${getInitials(msg.sender_name)}`} data-ai-hint="profile person" />
                        <AvatarFallback>{getInitials(msg.sender_name)}</AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="p-4 border-t">
          <form onSubmit={handleSendMessage} className="flex w-full items-center gap-2">
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
          </form>
        </CardFooter>
      </Card>
    </div>
  );
}
