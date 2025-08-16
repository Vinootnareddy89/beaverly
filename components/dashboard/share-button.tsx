
"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

interface ShareButtonProps {
    tasks: Task[];
}

export function ShareButton({ tasks }: ShareButtonProps) {
    const { toast } = useToast();

    const handleShare = () => {
        const incompleteTasks = tasks.filter(task => !task.completed);
        const completedTasks = tasks.filter(task => task.completed);

        let shareText = "Here's my progress for today!\n\n";

        if (incompleteTasks.length > 0) {
            shareText += "📋 To-Do:\n";
            incompleteTasks.forEach(task => {
                shareText += `- ${task.text}\n`;
            });
        } else {
            shareText += "✅ All tasks completed! 🎉\n";
        }
        
        if (completedTasks.length > 0) {
            shareText += "\n✅ Completed:\n";
            completedTasks.forEach(task => {
                shareText += `- ${task.text}\n`;
            });
        }

        navigator.clipboard.writeText(shareText).then(() => {
            toast({ title: 'Copied to clipboard!', description: 'You can now share your task list.' });
        }).catch(err => {
            toast({ title: 'Error', description: 'Could not copy to clipboard.', variant: 'destructive' });
            console.error('Failed to copy text: ', err);
        });
    };

    return (
        <Button onClick={handleShare} variant="outline">
            <Share2 className="mr-2 h-4 w-4" />
            Share Progress
        </Button>
    );
}
