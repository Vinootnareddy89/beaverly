
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2, Calendar as CalendarIcon, Bell } from 'lucide-react';
import { format, parseISO, isPast, startOfToday } from 'date-fns';
import type { Reminder } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/context/auth-context';
import { remindersService } from '@/lib/firebase';

export default function RemindersPage() {
  const { user, loading } = useAuth();
  const [reminders, setReminders] = useState<Reminder[]>([]);
  const [newReminderText, setNewReminderText] = useState('');
  const [newReminderDate, setNewReminderDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user) {
      const unsubscribe = remindersService.onUpdate(setReminders);
      return () => unsubscribe();
    }
  }, [isMounted, user]);

  const handleAddReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newReminderText.trim() === '' || newReminderDate.trim() === '') return;

    const newReminder: Omit<Reminder, 'id'> = {
      text: newReminderText.trim(),
      date: newReminderDate, // Stored as 'yyyy-MM-dd'
    };

    await remindersService.add(newReminder);
    setNewReminderText('');
    setNewReminderDate('');
  };

  const deleteReminder = async (id: string) => {
    if(!user) return;
    await remindersService.remove(id);
  };

  if (!isMounted || loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const sortedReminders = [...reminders].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  const isToday = (someDate: Date) => {
    const today = startOfToday()
    return someDate.getFullYear() === today.getFullYear() &&
           someDate.getMonth() === today.getMonth() &&
           someDate.getDate() === today.getDate()
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Reminder</CardTitle>
          <CardDescription>Set reminders for birthdays, anniversaries, or other important events.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddReminder} className="flex flex-col sm:flex-row gap-4">
            <Input
              value={newReminderText}
              onChange={(e) => setNewReminderText(e.target.value)}
              placeholder="Reminder (e.g., Mom's Birthday)"
              className="flex-grow"
            />
            <Input
              value={newReminderDate}
              onChange={(e) => setNewReminderDate(e.target.value)}
              type="date"
              className="sm:w-auto"
            />
            <Button type="submit">
              <Plus className="mr-2 h-4 w-4" /> Add Reminder
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>All Reminders</CardTitle>
          <CardDescription>You have {reminders.length} reminders saved.</CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[calc(100vh-450px)]">
            <div className="space-y-4">
              {sortedReminders.length > 0 ? (
                sortedReminders.map((reminder) => {
                   const reminderDate = parseISO(reminder.date);
                   const isReminderPast = isPast(reminderDate) && !isToday(reminderDate);
                   return (
                      <div key={reminder.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 group">
                        <Bell className="h-5 w-5 text-primary" />
                        <div className="flex-grow">
                          <p className={`font-semibold ${isReminderPast ? 'text-muted-foreground' : ''}`}>
                            {reminder.text}
                          </p>
                          <div className="flex items-center text-sm text-muted-foreground gap-2">
                              <CalendarIcon className="h-4 w-4" />
                              <span>{format(reminderDate, 'MMMM d, yyyy')}</span>
                          </div>
                        </div>
                         <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteReminder(reminder.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                   )
                })
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">No reminders yet. Add one above to get started!</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
