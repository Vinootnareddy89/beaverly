
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { isToday as isTodayFns, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import type { Task, Bill, Reminder } from '@/lib/types';
import { useAuth } from '@/context/auth-context';
import { billsService, remindersService } from '@/lib/firebase';

type TodayItem = {
  id: string;
  text: string;
  type: 'task' | 'bill' | 'reminder';
  completed: boolean;
};

interface TodaysTasksProps {
  tasks: Task[];
}

export function TodaysTasks({ tasks }: TodaysTasksProps) {
    const { user, loading } = useAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);
    const [todayItems, setTodayItems] = useState<TodayItem[]>([]);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && user) {
            const unsubBills = billsService.onUpdate(setBills);
            const unsubReminders = remindersService.onUpdate(setReminders);
            return () => {
                unsubBills();
                unsubReminders();
            };
        }
    }, [isMounted, user]);
    
    const isToday = (date: any): boolean => {
        if (!date) return false;
        // The date from firestore is already a JS Date object thanks to our service.
        const d = date instanceof Date ? date : parseISO(date);
        if (isNaN(d.getTime())) return false; // Invalid date
        
        return isTodayFns(d);
    };

    useEffect(() => {
        const items: TodayItem[] = [];

        tasks.forEach(task => {
            if (task.dueDate && isToday(task.dueDate)) {
                 if (!task.completed) {
                    items.push({ id: task.id, text: task.text, type: 'task', completed: task.completed });
                 }
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
        
        setTodayItems(items.sort((a,b) => a.text.localeCompare(b.text)));
    }, [tasks, bills, reminders]);

    if (!isMounted || loading) {
        return (
            <Card className="h-full">
                <CardHeader>
                    <CardTitle>Today's Tasks</CardTitle>
                    <CardDescription>Tasks and bills due today.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="h-[200px] w-full bg-muted animate-pulse rounded-md" />
                </CardContent>
            </Card>
        )
    }

    const badgeVariant = (type: TodayItem['type']) => {
        switch (type) {
            case 'task': return 'secondary';
            case 'bill': return 'destructive';
            case 'reminder': return 'default';
            default: return 'outline';
        }
    }

     const iconColor = (type: TodayItem['type']) => {
        switch (type) {
            case 'task': return 'bg-slate-400';
            case 'bill': return 'bg-destructive';
            case 'reminder': return 'bg-primary';
            default: return 'bg-gray-300';
        }
    }


    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle>Today's Agenda</CardTitle>
                <CardDescription>A combined view of your tasks, bills, and reminders.</CardDescription>
            </CardHeader>
            <CardContent>
                <ScrollArea className="h-[200px]">
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
                            <p className="text-sm text-muted-foreground text-center py-10">
                                Nothing on the agenda for today. Enjoy your day!
                            </p>
                        )}
                    </div>
                </ScrollArea>
            </CardContent>
        </Card>
    );
}
