"use client";

import React, { useState, useEffect } from 'react';
import type { Task, Event } from '@/lib/types';
import { TaskList } from '@/components/dashboard/task-list';
import { ProgressTracker } from '@/components/dashboard/progress-tracker';
import { TodaysTasks } from '@/components/dashboard/todays-tasks';
import { VoiceMemo } from '@/components/dashboard/voice-memo';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calendar } from "@/components/ui/calendar";
import { useAuth } from '@/context/auth-context';
import { tasksService, eventsService } from '@/lib/firebase';
import { LoadingScreen } from '@/components/loading-screen';

export default function DashboardClient() {
  const { user, loading } = useAuth();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [date, setDate] = useState<Date | undefined>(new Date());

  // --- Firestore real-time listeners ---
  useEffect(() => {
    if (user) {
      const unsubscribeTasks = tasksService.onUpdate(setTasks);
      const unsubscribeEvents = eventsService.onUpdate(setEvents);

      return () => {
        unsubscribeTasks();
        unsubscribeEvents();
      };
    }
  }, [user]);

  // --- Calendar event modifiers ---
  const eventCountModifiers = React.useMemo(() => {
    const modifiers: Record<string, Date[]> = {
      level1: [], level2: [], level3: [], level4: [],
    };
    const eventsByDate: Record<string, number> = {};

    events.forEach(event => {
      const eventDate = new Date(event.date);
      const userTimezoneOffset = eventDate.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(eventDate.getTime() + userTimezoneOffset);
      const key = adjustedDate.toISOString().split('T')[0];
      eventsByDate[key] = (eventsByDate[key] || 0) + 1;
    });

    for (const key in eventsByDate) {
      const date = new Date(key);
      const userTimezoneOffset = date.getTimezoneOffset() * 60000;
      const adjustedDate = new Date(date.getTime() + userTimezoneOffset);

      const count = eventsByDate[key];
      if (count === 1) modifiers.level1.push(adjustedDate);
      else if (count === 2) modifiers.level2.push(adjustedDate);
      else if (count === 3) modifiers.level3.push(adjustedDate);
      else if (count >= 4) modifiers.level4.push(adjustedDate);
    }

    return modifiers;
  }, [events]);

  if (loading) return <LoadingScreen />;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <div className="lg:col-span-2 h-full">
        <TodaysTasks tasks={tasks} />
      </div>

      <div className="lg:col-span-2 h-full">
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
              modifiers={eventCountModifiers}
              modifiersClassNames={{
                level1: 'bg-primary/20',
                level2: 'bg-primary/50',
                level3: 'bg-primary/80',
                level4: 'bg-primary',
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
