"use client";

import React, { useState, useEffect } from 'react';
import type { Task, Event, Bill, Reminder } from '@/lib/types';
import { TaskList } from '@/components/dashboard/task-list';
import { ProgressTracker } from '@/components/dashboard/progress-tracker';
import { TodaysTasks } from '@/components/dashboard/todays-tasks';
import { VoiceMemo } from '@/components/dashboard/voice-memo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from '@/context/auth-context';
import { tasksService, eventsService, billsService, remindersService } from '@/lib/firebase';
import { LoadingScreen } from '@/components/loading-screen';
import { parseISO, isValid } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // --- Firestore real-time listeners ---
  useEffect(() => {
    if (user) {
      const unsubscribeTasks = tasksService.onUpdate(setTasks);
      const unsubscribeEvents = eventsService.onUpdate(setEvents);
      const unsubscribeBills = billsService.onUpdate(setBills);
      const unsubscribeReminders = remindersService.onUpdate(setReminders);

      return () => {
        unsubscribeTasks();
        unsubscribeEvents();
        unsubscribeBills();
        unsubscribeReminders();
      };
    }
  }, [user]);

  // --- Calendar event modifiers ---
  const itemCountModifiers = React.useMemo(() => {
    const modifiers: Record<string, Date[]> = {
      level1: [], level2: [], level3: [], level4: [],
    };
    const itemsByDate: Record<string, number> = {};

    const addItemToCount = (dateValue: Date | string | Timestamp | null | undefined) => {
        if (!dateValue) return;

        let d: Date;
        if (dateValue instanceof Timestamp) {
          d = dateValue.toDate();
        } else if (typeof dateValue === 'string') {
          d = parseISO(dateValue);
        } else if (dateValue instanceof Date) {
          d = dateValue;
        } else {
            return; // Unsupported type
        }

        if (!isValid(d)) return;
        const key = d.toISOString().split('T')[0];
        itemsByDate[key] = (itemsByDate[key] || 0) + 1;
    }

    tasks.forEach(task => addItemToCount(task.dueDate));
    events.forEach(event => addItemToCount(event.date));
    bills.forEach(bill => addItemToCount(bill.dueDate));
    reminders.forEach(reminder => addItemToCount(reminder.date));


    for (const key in itemsByDate) {
      const date = parseISO(key);
       // Adjust for timezone display in the calendar
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

      const count = itemsByDate[key];
      if (count === 1) modifiers.level1.push(adjustedDate);
      else if (count === 2) modifiers.level2.push(adjustedDate);
      else if (count === 3) modifiers.level3.push(adjustedDate);
      else if (count >= 4) modifiers.level4.push(adjustedDate);
    }

    return modifiers;
  }, [events, tasks, bills, reminders]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2 h-full min-h-[450px]">
        <TodaysTasks tasks={tasks} bills={bills} events={events} reminders={reminders} />
      </div>

      <div className="lg:col-span-2 h-full min-h-[450px]">
        <Card className="h-full flex flex-col">
          <CardHeader>
            <CardTitle>Calendar</CardTitle>
          </CardHeader>
          <CardContent className="pl-3.5 flex-grow flex items-center justify-center">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              className="rounded-md"
              modifiers={itemCountModifiers}
              modifiersClassNames={{
                level1: 'bg-primary/20',
                level2: 'bg-primary/40',
                level3: 'bg-primary/60',
                level4: 'bg-primary/80',
              }}
            />
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-4 h-full">
        <TaskList tasks={tasks} />
      </div>

      <div className="lg:col-span-2 h-full">
        <VoiceMemo />
      </div>

      <div className="lg:col-span-2 h-full">
        <ProgressTracker tasks={tasks} />
      </div>
    </div>
  );
}
