
"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Memo } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { memosService, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

export function VoiceMemoButton() {
    const { user } = useAuth();
    const [isRecording, setIsRecording] = useState(false);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const { toast } = useToast();
    const [isProcessing, setIsProcessing] = useState(false);
    
    useEffect(() => {
        return () => {
            if (mediaRecorderRef.current && mediaRecorderRef.current.stream) {
                mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    const startRecording = async () => {
        if (isProcessing) return;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const options = { mimeType: 'audio/webm' };
            mediaRecorderRef.current = new MediaRecorder(stream, options);
            audioChunksRef.current = [];

            mediaRecorderRef.current.ondataavailable = (event) => {
                audioChunksRef.current.push(event.data);
            };

            mediaRecorderRef.current.onstop = async () => {
                setIsProcessing(true);
                
                if (!user) {
                    toast({ variant: 'destructive', title: "Not Authenticated", description: "You must be logged in to save memos." });
                    setIsProcessing(false);
                    return;
                }
                
                const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                
                try {
                    toast({ title: "Uploading Memo...", description: "Please wait." });
                    
                    const fileName = `voice-memos/${user.uid}/${crypto.randomUUID()}.webm`;
                    const storageRef = ref(storage, fileName);

                    const snapshot = await uploadBytes(storageRef, audioBlob);
                    const downloadURL = await getDownloadURL(snapshot.ref);

                    const newMemo: Omit<Memo, 'id'> = {
                        audioUrl: downloadURL,
                        storagePath: fileName,
                        createdAt: new Date(),
                    };
                    await memosService.add(newMemo);
                    toast({ title: "Memo Saved!", description: "Your voice memo has been saved." });

                } catch (uploadError) {
                    console.error("Error processing or uploading memo: ", uploadError);
                    toast({ variant: 'destructive', title: "Save Failed", description: "Could not save your voice memo." });
                } finally {
                    setIsProcessing(false);
                    // Stop the media stream tracks
                    if (mediaRecorderRef.current?.stream) {
                         mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
                    }
                }
            };

            mediaRecorderRef.current.start();
            setIsRecording(true);
            toast({ title: "Recording started", description: "Click the stop button to finish." });
        } catch (error) {
            console.error("Error accessing microphone:", error);
            toast({ variant: 'destructive', title: "Microphone Error", description: "Could not access microphone. Please check permissions." });
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current) {
            mediaRecorderRef.current.stop();
            setIsRecording(false);
        }
    };

    return (
        <Button onClick={isRecording ? stopRecording : startRecording} variant={isRecording ? 'destructive' : 'outline'} disabled={isProcessing}>
            {isRecording ? <StopCircle className="mr-2 h-4 w-4" /> : <Mic className="mr-2 h-4 w-4" />}
            {isProcessing ? 'Saving...' : isRecording ? 'Stop Recording' : 'Voice Memo'}
        </Button>
    );
}
