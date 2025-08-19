"use client";

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isToday as isTodayFns, parseISO, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, Bill, Reminder, Event } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { Timestamp } from 'firebase/firestore';


type TodayItem = {
  id: string;
  text: string;
  type: 'task' | 'bill' | 'reminder' | 'event';
  completed: boolean;
};

interface TodaysTasksProps {
  tasks: Task[];
  bills: Bill[];
  events: Event[];
  reminders: Reminder[];
}

export default function TodaysTasks({ tasks = [], bills = [], events = [], reminders = [] }: TodaysTasksProps) {
    const { loading } = useAuth();
    
    const isToday = (date: Date | string | Timestamp | null | undefined): boolean => {
        if (!date) return false;
        
        let d: Date;
        if (date instanceof Timestamp) {
            d = date.toDate();
        } else if (date instanceof Date) {
            d = date;
        } else if (typeof date === 'string') {
            d = parseISO(date);
        } else {
            return false;
        }

        if (!isValid(d)) return false;
        
        return isTodayFns(d);
    };

    const todayItems = useMemo(() => {
        const items: TodayItem[] = [];

        tasks.forEach(task => {
            if (task.dueDate && isToday(task.dueDate) && !task.completed) {
                items.push({ id: task.id, text: task.text, type: 'task', completed: task.completed });
            }
        });

        bills.forEach(bill => {
            if (isToday(bill.dueDate) && !bill.isPaid) {
                items.push({ id: bill.id, text: `Pay ${bill.name}`, type: 'bill', completed: bill.isPaid });
            }
        });

        reminders.forEach(reminder => {
            if (isToday(reminder.date)) {
                items.push({ id: reminder.id, text: reminder.text, type: 'reminder', completed: false });
            }
        });
        
        events.forEach(event => {
            if (isToday(event.date)) {
                items.push({ id: event.id, text: event.text, type: 'event', completed: false });
            }
        });
        
        return items.sort((a,b) => a.text.localeCompare(b.text));
    }, [tasks, bills, reminders, events]);

    if (loading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Today&apos;s Agenda</CardTitle>
                    <CardDescription>A combined view of your tasks, bills, and reminders.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-full w-full bg-muted animate-pulse rounded-md" />
                </CardContent>
            </Card>
        )
    }

    const badgeVariant = (type: TodayItem['type']) => {
        switch (type) {
            case 'task': return 'secondary';
            case 'bill': return 'destructive';
            case 'reminder': return 'default';
            case 'event': return 'outline';
            default: return 'outline';
        }
    }

     const iconColor = (type: TodayItem['type']) => {
        switch (type) {
            case 'task': return 'bg-slate-400';
            case 'bill': return 'bg-destructive';
            case 'reminder': return 'bg-primary';
            case 'event': return 'bg-accent-foreground';
            default: return 'bg-gray-300';
        }
    }


    return (
        <Card className="h-full flex flex-col">
            <CardHeader>
                <CardTitle>Today&apos;s Agenda</CardTitle>
                <CardDescription>A combined view of your tasks, bills, and reminders.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <ScrollArea className="h-full">
                    <div className="space-y-3">
                        {todayItems.length > 0 ? (
                            todayItems.map(item => (
                                <div key={`${item.type}-${item.id}`} className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                                    <span className={cn("w-2 h-2 rounded-full", iconColor(item.type))} />
                                    <p className={cn("flex-grow text-sm", item.completed && "line-through text-muted-foreground")}>
                                        {item.text}
                                    </p>
                                    <Badge variant={badgeVariant(item.type)} className="capitalize">{item.type}</Badge>
                                </div>
                            ))
                        ) : (
                            <div className="flex items-center justify-center h-full">
                                <p className="text-sm text-muted-foreground text-center py-10">
                                    Nothing on the agenda for today. Enjoy your day!
                                </p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
