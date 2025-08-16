
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trash2, Play, Voicemail } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import type { Memo } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { memosService } from '@/lib/firebase';
import { VoiceMemoButton } from './voice-memo-button';

export function VoiceMemo() {
    const { user, loading } = useAuth();
    const [memos, setMemos] = useState<Memo[]>([]);
    const [isMounted, setIsMounted] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && user) {
            const unsubscribe = memosService.onUpdate(setMemos);
            return () => unsubscribe();
        }
    }, [isMounted, user]);

    const deleteMemo = async (memo: Memo) => {
        if(!user) return;
        try {
            await memosService.remove(memo.id, memo.storagePath);
            toast({ title: "Memo deleted" });
        } catch (error) {
            console.error("Error deleting memo:", error);
            toast({ title: "Error", description: "Could not delete memo.", variant: "destructive" });
        }
    };
    
    if (!isMounted || loading) {
        return (
            <Card className="col-span-1 xl:col-span-2 h-full">
                <CardHeader>
                   <Skeleton className="h-8 w-40" />
                   <Skeleton className="h-4 w-56 mt-2" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-[200px] w-full" />
                </CardContent>
            </Card>
        );
    }
    
    const playAudio = (audioUrl: string) => {
        const audio = new Audio(audioUrl);
        audio.play().catch(e => {
            console.error("Error playing audio:", e);
            toast({ title: "Playback Error", description: "Could not play audio.", variant: "destructive" });
        });
    }

    return (
        <Card className="col-span-1 xl:col-span-2 h-full">
            <CardHeader className="flex flex-row items-center justify-between">
                 <div>
                    <CardTitle className="flex items-center gap-2">
                        <Voicemail className="w-5 h-5" />
                        Voice Memos
                    </CardTitle>
                    <CardDescription>A list of your recorded thoughts.</CardDescription>
                </div>
                <VoiceMemoButton />
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px] pr-4">
                    <div className="space-y-3">
                        {memos.length > 0 ? (
                            memos.map(memo => (
                                <div key={memo.id} className="flex items-center gap-3 p-2 bg-muted/50 rounded-lg group">
                                    <Button 
                                        size="icon" 
                                        variant="ghost" 
                                        onClick={() => playAudio(memo.audioUrl)}
                                        className="h-8 w-8"
                                    >
                                        <Play className="h-4 w-4" />
                                    </Button>
                                    <div className="flex-grow">
                                        <p className="text-sm font-medium">Voice Memo</p>
                                        <p className="text-xs text-muted-foreground">
                                            {format(new Date(memo.createdAt as Date), "MMM d, yyyy 'at' h:mm a")}
                                        </p>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-0 group-hover:opacity-100"
                                        onClick={() => deleteMemo(memo)}
                                    >
                                        <Trash2 className="h-4 w-4 text-destructive" />
                                    </Button>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full min-h-[100px]">
                                <p className="text-sm text-muted-foreground text-center">
                                    No voice memos yet.
                                    <br />
                                    Click the microphone above to start recording.
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
