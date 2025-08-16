
"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Task } from '@/lib/types';

export default function RecurringPage() {
  const [newRecurrenceText, setNewRecurrenceText] = useState('');
  const { toast } = useToast();

  const handleTextSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    toast({ title: 'Feature Disabled', description: 'The AI recurring task feature is currently not available.', variant: 'destructive' });
  };

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>AI Recurring Tasks</CardTitle>
          <CardDescription>This feature is temporarily disabled.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTextSubmit} className="flex gap-2 mb-4">
            <Input
              value={newRecurrenceText}
              onChange={(e) => setNewRecurrenceText(e.target.value)}
              placeholder="E.g., Take out the trash every Tuesday at 8pm"
              disabled={true}
            />
            <Button type="submit" size="icon" disabled={true}>
              <Plus />
            </Button>
          </form>
           <p className="text-sm text-muted-foreground">The AI recurring task functionality has been removed to resolve build issues. It can be re-implemented in the future.</p>
        </CardContent>
      </Card>
    </div>
  );
}
