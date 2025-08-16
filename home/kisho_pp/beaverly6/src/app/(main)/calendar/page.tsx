
"use client";

import React, { useState, useMemo, useEffect } from 'react';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, CheckSquare, Calendar as CalendarIcon } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import type { Event, Task } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { tasksService, eventsService } from '@/lib/firebase';
import { Badge } from '@/components/ui/badge';

type CalendarItem = {
    id: string;
    text: string;
    type: 'event' | 'task';
    date: string;
};

// Helper to reliably convert Firestore Timestamp or string to a JS Date
const toDate = (firestoreDate: any): Date | null => {
    if (!firestoreDate) return null;
    // It's already a JS Date object from our firebase service
    if (firestoreDate instanceof Date) {
        return firestoreDate;
    }
    try { 
        // Handles ISO strings from older data
        const d = parseISO(firestoreDate);
        if (!isNaN(d.getTime())) {
             return d;
        }
    } catch (e) {
        console.error("Could not parse date:", firestoreDate);
    }
    return null;
}


export default function CalendarPage() {
  const { user, loading } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [events, setEvents] = useState<Event[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [newEventText, setNewEventText] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user) {
        const unsubscribeTasks = tasksService.onUpdate(setTasks);
        const unsubscribeEvents = eventsService.onUpdate(setEvents);
        return () => {
          unsubscribeTasks();
          unsubscribeEvents();
        }
    }
  }, [isMounted, user]);

  const allItems = useMemo<CalendarItem[]>(() => {
    const taskItems: CalendarItem[] = tasks
      .filter(task => !!task.dueDate) // Ensure task has a due date before mapping
      .map(task => {
        const dueDate = toDate(task.dueDate);
        if (!dueDate) return null;
        return {
          id: task.id,
          text: task.text,
          type: 'task',
          date: format(dueDate, 'yyyy-MM-dd'),
        } as CalendarItem;
      })
      .filter((item): item is CalendarItem => item !== null);

    const eventItems: CalendarItem[] = events.map(event => {
       const eventDate = toDate(event.date);
       if (!eventDate) return null;
       return {
            id: event.id,
            text: event.text,
            type: 'event',
            date: format(eventDate, 'yyyy-MM-dd'),
        } as CalendarItem
    }).filter((item): item is CalendarItem => item !== null);

    return [...taskItems, ...eventItems];
  }, [tasks, events]);

  const eventDates = useMemo(() => {
    return events.map(event => toDate(event.date)).filter((d): d is Date => d !== null);
  }, [events]);

  const taskDates = useMemo(() => {
    return tasks.filter(task => !!task.dueDate).map(task => toDate(task.dueDate)).filter((d): d is Date => d !== null);
  }, [tasks]);

  const selectedDayKey = date ? format(date, 'yyyy-MM-dd') : '';
  
  const selectedDayItems = useMemo(() => allItems.filter(e => e.date === selectedDayKey), [allItems, selectedDayKey]);

  if (!isMounted || loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Skeleton className="md:col-span-2 h-96" />
        <Skeleton className="md:col-span-1 h-96" />
      </div>
    );
  }

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !user || newEventText.trim() === '') return;
    const newEvent: Omit<Event, 'id'> = { 
        text: newEventText.trim(),
        date: format(date, 'yyyy-MM-dd'),
    };
    await eventsService.add(newEvent);
    setNewEventText('');
  };

  const handleDeleteEvent = async (id: string) => {
    if(!user) return;
    await eventsService.remove(id);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
      <Card className="md:col-span-2">
        <CardContent className="p-2 md:p-6 flex justify-center">
          <Calendar
            mode="single"
            selected={date}
            onSelect={setDate}
            className="rounded-md"
            modifiers={{
              hasEvent: eventDates,
              hasTask: taskDates,
            }}
            modifiersClassNames={{
              hasEvent: 'bg-primary/50 text-primary-foreground',
              hasTask: 'bg-accent/70 text-accent-foreground',
            }}
          />
        </CardContent>
      </Card>
      
      <Card className="md:col-span-1">
        <CardHeader>
          <CardTitle>
            {date ? format(date, 'MMMM d, yyyy') : 'Select a date'}
          </CardTitle>
          <CardDescription>Tasks and events for the selected day.</CardDescription>
        </CardHeader>
        <CardContent>
          {date && (
            <form onSubmit={handleAddEvent} className="flex gap-2 mb-4">
              <Input
                value={newEventText}
                onChange={(e) => setNewEventText(e.target.value)}
                placeholder="Add an event..."
              />
              <Button type="submit" size="icon">
                <Plus />
              </Button>
            </form>
          )}

          <div className="space-y-2">
            {selectedDayItems.length > 0 ? (
              selectedDayItems.map(item => (
                <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md group">
                  {item.type === 'task' ? <CheckSquare className="h-4 w-4 text-primary" /> : <CalendarIcon className="h-4 w-4 text-primary" />}
                  <p className="flex-grow text-sm">{item.text}</p>
                   {item.type === 'event' ? (
                     <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => handleDeleteEvent(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                   ) : <div className="w-7 h-7" /> }
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No items for this day.</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
