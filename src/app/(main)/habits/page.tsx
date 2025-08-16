
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Check, Plus, Trash2, Zap, Book, Dumbbell, Brain, Flame } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { format, subDays, isSameDay, startOfDay } from 'date-fns';
import type { Habit } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { habitsService } from '@/lib/firebase';

const iconMap = {
  Zap: <Zap />,
  Book: <Book />,
  Dumbbell: <Dumbbell />,
  Brain: <Brain />,
};

type IconName = keyof typeof iconMap;

const habitIcons: IconName[] = ['Zap', 'Book', 'Dumbbell', 'Brain'];

export default function HabitsPage() {
  const { user, loading } = useAuth();
  const [habits, setHabits] = useState<Habit[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState<IconName>('Zap');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user) {
      const unsubscribe = habitsService.onUpdate(setHabits);
      return () => unsubscribe();
    }
  }, [isMounted, user]);

  const weekDays = useMemo(() => {
    const today = startOfDay(new Date());
    return Array.from({ length: 7 }).map((_, i) => subDays(today, i)).reverse();
  }, []);

  const calculateStreak = (completions: Record<string, boolean>): number => {
    let streak = 0;
    let today = startOfDay(new Date());
    let currentDay = today;

    while (completions[format(currentDay, 'yyyy-MM-dd')]) {
      streak++;
      currentDay = subDays(currentDay, 1);
    }
    
    if (streak === 0 && !completions[format(today, 'yyyy-MM-dd')]) {
        currentDay = subDays(today, 1);
        while (completions[format(currentDay, 'yyyy-MM-dd')]) {
            streak++;
            currentDay = subDays(currentDay, 1);
        }
    }
    return streak;
  };

  const handleAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newHabitName.trim() === '') return;
    const newHabit: Omit<Habit, 'id'> = {
      name: newHabitName.trim(),
      icon: selectedIcon,
      completions: {},
    };
    await habitsService.add(newHabit);
    setNewHabitName('');
    setSelectedIcon('Zap');
  };
  
  const handleDeleteHabit = async (id: string) => {
    if(!user) return;
    await habitsService.remove(id);
  };

  const toggleCompletion = async (habit: Habit, date: Date) => {
    if(!user) return;
    const newCompletions = { ...habit.completions };
    const dateKey = format(date, 'yyyy-MM-dd');
    if (newCompletions[dateKey]) {
      delete newCompletions[dateKey];
    } else {
      newCompletions[dateKey] = true;
    }
    await habitsService.update(habit.id, { completions: newCompletions });
  };

  if (!isMounted || loading) {
    return (
      <div className="space-y-8">
        <Skeleton className="h-40 w-full" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Habit</CardTitle>
          <CardDescription>Start tracking a new daily goal.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddHabit} className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="icon" className="w-full sm:w-12 h-12">
                  {iconMap[selectedIcon]}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-2">
                <div className="flex gap-2">
                  {habitIcons.map(iconName => (
                    <Button
                      key={iconName}
                      variant={selectedIcon === iconName ? 'default' : 'ghost'}
                      size="icon"
                      onClick={() => setSelectedIcon(iconName)}
                    >
                      {iconMap[iconName]}
                    </Button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>
            <Input
              value={newHabitName}
              onChange={(e) => setNewHabitName(e.target.value)}
              placeholder="e.g., Read for 15 minutes"
              className="h-12"
            />
            <Button type="submit" size="lg" className="h-12">
              <Plus className="mr-2 h-4 w-4" /> Add Habit
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {habits.map(habit => (
          <Card key={habit.id} className="flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="text-primary">{React.cloneElement(iconMap[habit.icon as IconName], { className: 'w-8 h-8' })}</div>
                    <CardTitle className="text-xl">{habit.name}</CardTitle>
                </div>
                 <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteHabit(habit.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col justify-between space-y-4">
              <div className="flex justify-between items-center rounded-lg bg-muted/50 -ml-2.5">
                {weekDays.map(day => {
                  const dateKey = format(day, 'yyyy-MM-dd');
                  const isCompleted = habit.completions[dateKey];
                  
                  return (
                    <button
                      key={dateKey}
                      onClick={() => toggleCompletion(habit, day)}
                      className="flex flex-col items-center gap-1.5 p-1 rounded-md transition-colors hover:bg-primary/10 flex-1"
                    >
                      <span className="text-xs text-muted-foreground">{format(day, 'E')}</span>
                      <div className={cn(
                          "w-7 h-7 rounded-full flex items-center justify-center border-2",
                          isCompleted ? "bg-primary border-primary text-primary-foreground" : "bg-background border-border"
                      )}>
                        {isCompleted ? <Check className="w-4 h-4" /> : format(day, 'd')}
                      </div>
                    </button>
                  );
                })}
              </div>
              <div className="text-center bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center justify-center gap-2">
                    <Flame className="w-6 h-6 text-amber-500" />
                    <p className="text-2xl font-bold">{calculateStreak(habit.completions)}</p>
                </div>
                <p className="text-sm text-muted-foreground">day streak</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
       {habits.length === 0 && (
          <div className="text-center py-12">
            <p className="text-lg font-semibold">No habits yet!</p>
            <p className="text-muted-foreground">Add your first habit above to get started.</p>
          </div>
        )}
    </div>
  );
}
