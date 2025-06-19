'use client';

import { curriculum } from '@/lib/curriculum-data';
import type { Unit, Round, Word } from '@/lib/types';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { LibraryBig, Layers, ListChecks, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function TeacherCurriculumPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center space-x-3">
        <LibraryBig className="h-10 w-10 text-primary" />
        <h1 className="text-4xl font-bold font-headline">Учебный План</h1>
      </div>

      <Card className="shadow-lg">
        <CardHeader>
          <CardTitle>Обзор Юнитов и Раундов</CardTitle>
          <CardDescription>Просмотрите структуру учебных материалов, включая юниты, раунды и слова в них.</CardDescription>
        </CardHeader>
        <CardContent>
          {curriculum.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Учебные материалы не найдены</AlertTitle>
              <AlertDescription>В системе пока нет доступных юнитов.</AlertDescription>
            </Alert>
          ) : (
            <Accordion type="multiple" className="w-full space-y-4">
              {curriculum.map((unit: Unit) => (
                <AccordionItem value={unit.id} key={unit.id} className="border rounded-lg overflow-hidden">
                  <AccordionTrigger className="text-xl font-semibold hover:bg-muted/50 px-6 py-4 bg-muted/20">
                    <div className="flex items-center space-x-3">
                       <Layers className="h-6 w-6 text-primary" />
                       <span>{unit.name}</span>
                       <span className="text-sm text-muted-foreground font-normal">({unit.rounds.length} {unit.rounds.length === 1 ? 'раунд' : (unit.rounds.length > 1 && unit.rounds.length < 5 ? 'раунда' : 'раундов')})</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 py-4 space-y-3 bg-background">
                    {unit.rounds.length === 0 ? (
                      <p className="text-sm text-muted-foreground">В этом юните нет раундов.</p>
                    ) : (
                      <Accordion type="multiple" className="w-full space-y-2">
                        {unit.rounds.map((round: Round) => (
                          <AccordionItem value={round.id} key={round.id} className="border rounded-md overflow-hidden">
                            <AccordionTrigger className="text-md font-medium hover:bg-muted/30 px-4 py-3 bg-muted/10">
                               <div className="flex items-center space-x-2">
                                   <ListChecks className="h-5 w-5 text-secondary-foreground" />
                                   <span>{round.name}</span>
                                   <span className="text-xs text-muted-foreground font-normal">({round.words.length} {round.words.length === 1 ? 'слово' : (round.words.length > 1 && round.words.length < 5 ? 'слова' : 'слов')})</span>
                               </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 py-3">
                              {round.words.length === 0 ? (
                                <p className="text-xs text-muted-foreground">В этом раунде нет слов.</p>
                              ) : (
                                <div className="overflow-x-auto">
                                  <Table>
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead className="w-[30%]">Английский</TableHead>
                                        <TableHead className="w-[40%]">Русский</TableHead>
                                        <TableHead className="w-[30%]">Транскрипция</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {round.words.map((word: Word) => (
                                        <TableRow key={word.id}>
                                          <TableCell className="font-medium">{word.english}</TableCell>
                                          <TableCell>{word.russian}</TableCell>
                                          <TableCell className="italic">{word.transcription}</TableCell>
                                        </TableRow>
                                      ))}
                                    </TableBody>
                                  </Table>
                                </div>
                              )}
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    )}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
