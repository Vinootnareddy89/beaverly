
"use client";

import React, { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, Pie, PieChart, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import type { Task } from '@/lib/types';
import { format, subDays, parseISO } from 'date-fns';

interface ProgressTrackerProps {
  tasks: Task[];
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--muted))'];

export function ProgressTracker({ tasks }: ProgressTrackerProps) {
  const weeklyChartData = useMemo(() => {
    const data = Array.from({ length: 7 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        name: format(date, 'EEE'),
        date: format(date, 'yyyy-MM-dd'),
        total: 0,
      };
    }).reverse();

    tasks.forEach(task => {
      if (task.completed && task.completedAt) {
        const completedDateStr = task.completedAt.toString();
        const completedDateObj = new Date(completedDateStr);
        // Check if the date is valid before formatting
        if (!isNaN(completedDateObj.getTime())) {
            const completedDate = format(completedDateObj, 'yyyy-MM-dd');
            const dayData = data.find(d => d.date === completedDate);
            if (dayData) {
              dayData.total++;
            }
        }
      }
    });

    return data;
  }, [tasks]);
  
  const overallProgressData = useMemo(() => {
    const completedTasks = tasks.filter(task => task.completed).length;
    const pendingTasks = tasks.filter(task => !task.completed).length;
    return [
        { name: 'Completed', value: completedTasks },
        { name: 'Pending', value: pendingTasks },
    ]
  }, [tasks])

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Progress Tracker</CardTitle>
        <CardDescription>Your productivity overview.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">Tasks Completed (Last 7 Days)</h4>
            {weeklyChartData.every(d => d.total === 0) ? (
            <div className="flex h-[150px] items-center justify-center">
                <p className="text-xs text-muted-foreground">No tasks completed recently.</p>
            </div>
            ) : (
            <ResponsiveContainer width="100%" height={150}>
                <BarChart data={weeklyChartData}>
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    allowDecimals={false}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                    contentStyle={{
                    backgroundColor: 'hsl(var(--background))',
                    borderColor: 'hsl(var(--border))',
                    borderRadius: 'var(--radius)',
                    }}
                />
                <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
            </ResponsiveContainer>
            )}
        </div>
        <div>
            <h4 className="text-sm font-medium text-muted-foreground mb-2 text-center">Overall Task Progress</h4>
            {(tasks.filter(t => !t.isRecurring || !t.completed).length) === 0 ? (
                 <div className="flex h-[150px] items-center justify-center">
                    <p className="text-xs text-muted-foreground">No tasks yet. Add some to get started!</p>
                </div>
            ) : (
            <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                    <Pie
                        data={overallProgressData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                        {overallProgressData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                     <Tooltip
                        cursor={{ fill: 'hsl(var(--accent) / 0.2)' }}
                        contentStyle={{
                        backgroundColor: 'hsl(var(--background))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        }}
                    />
                </PieChart>
            </ResponsiveContainer>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
