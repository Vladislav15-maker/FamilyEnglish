'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { curriculum } from '@/lib/curriculum-data';
import type { Unit, StudentRoundProgress, Word } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ArrowLeft, Repeat, AlertCircle } from 'lucide-react';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';

export default function LearnedWordsPage() {
    const { user, isLoading: authIsLoading } = useAuth();
    const [progress, setProgress] = useState<StudentRoundProgress[]>([]);
    const [completedUnits, setCompletedUnits] = useState<Unit[]>([]);
    const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
    const [selectedWords, setSelectedWords] = useState<Word[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        if (user && !authIsLoading) {
            setIsLoading(true);
            fetch(`/api/progress/student/${user.id}`)
                .then(res => res.json())
                .then((progressData: StudentRoundProgress[]) => {
                    setProgress(progressData);
                    const completedUnitIds = new Set<string>();
                    for (const unit of curriculum) {
                        const unitProgress = progressData.filter(p => p.unitId === unit.id);
                        const completedRounds = unitProgress.filter(p => p.completed).length;
                        if (unit.rounds.length > 0 && completedRounds === unit.rounds.length) {
                            completedUnitIds.add(unit.id);
                        }
                    }
                    setCompletedUnits(curriculum.filter(u => completedUnitIds.has(u.id)));
                })
                .finally(() => setIsLoading(false));
        }
    }, [user, authIsLoading]);

    const handleUnitSelect = (unitId: string) => {
        const unit = completedUnits.find(u => u.id === unitId);
        setSelectedUnit(unit || null);
        setSelectedWords([]);
    };

    const handleWordSelect = (word: Word) => {
        setSelectedWords(prev => 
            prev.some(w => w.id === word.id) 
                ? prev.filter(w => w.id !== word.id) 
                : [...prev, word]
        );
    };
    
    const handleSelectAll = () => {
        if (!selectedUnit) return;
        const allWordsInUnit = selectedUnit.rounds.flatMap(r => r.words);
        if (selectedWords.length === allWordsInUnit.length) {
            setSelectedWords([]);
        } else {
            setSelectedWords(allWordsInUnit);
        }
    };

    const startReview = () => {
      // For now, we just redirect to the first word's learn page.
      // A more complex implementation would create a temporary "review round".
      // This is a simple and effective approach for now.
      if (selectedWords.length > 0) {
        const firstWord = selectedWords[0];
        const round = selectedUnit?.rounds.find(r => r.words.some(w => w.id === firstWord.id));
        if(round && selectedUnit) {
            // This is a simplified approach. Ideally we would pass the list of words
            // to the learn page. We will implement that in a future step if needed.
            // For now, we just go to the original learn page.
             router.push(`/dashboard/units/${selectedUnit.id}/round/${round.id}/learn`);
        }
      }
    };

    if (isLoading || authIsLoading) {
        return <Skeleton className="h-64 w-full" />;
    }

    return (
        <div className="space-y-8">
            <Breadcrumb>
                <BreadcrumbList>
                <BreadcrumbItem>
                    <BreadcrumbLink asChild><Link href="/dashboard/student/home">Home</Link></BreadcrumbLink>
                </BreadcrumbItem>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                    <BreadcrumbPage>Learned Words</BreadcrumbPage>
                </BreadcrumbItem>
                </BreadcrumbList>
            </Breadcrumb>

            <div className="flex items-center justify-between">
                 <h1 className="text-4xl font-bold font-headline">Learned Words</h1>
                 <Button asChild variant="outline"><Link href="/dashboard/student/home"><ArrowLeft className="mr-2 h-4 w-4" />Back to Home</Link></Button>
            </div>

            <Card className="rounded-2xl">
                <CardHeader>
                    <CardTitle>Select a completed unit to review</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    {completedUnits.length === 0 ? (
                        <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertTitle>No Completed Units</AlertTitle>
                            <AlertDescription>You need to complete a unit before you can review its words.</AlertDescription>
                        </Alert>
                    ) : (
                        <Select onValueChange={handleUnitSelect}>
                            <SelectTrigger className="w-full md:w-1/2">
                                <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                            <SelectContent>
                                {completedUnits.map(unit => (
                                    <SelectItem key={unit.id} value={unit.id}>{unit.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    {selectedUnit && (
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold">Words in {selectedUnit.name}</h3>
                                <div className="flex items-center space-x-2">
                                    <Checkbox id="select-all" 
                                        onCheckedChange={handleSelectAll} 
                                        checked={selectedWords.length === selectedUnit.rounds.flatMap(r => r.words).length}
                                    />
                                    <label htmlFor="select-all" className="text-sm font-medium">Select All</label>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 max-h-64 overflow-y-auto p-4 border rounded-md">
                                {selectedUnit.rounds.flatMap(r => r.words).map(word => (
                                    <div key={word.id} className="flex items-center space-x-2">
                                        <Checkbox 
                                            id={word.id} 
                                            onCheckedChange={() => handleWordSelect(word)}
                                            checked={selectedWords.some(w => w.id === word.id)}
                                        />
                                        <label htmlFor={word.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                            {word.english}
                                        </label>
                                    </div>
                                ))}
                            </div>
                            <Button onClick={startReview} disabled={selectedWords.length === 0}>
                                <Repeat className="mr-2 h-4 w-4" />
                                Review ({selectedWords.length}) words
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
