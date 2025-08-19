"use client";

import React, { useState } from 'react';
import type { Task, TaskCategory } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Pencil, Calendar as CalendarIcon, AlertCircle, ChevronDown, Tag, Check, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import { format, isPast, isToday, differenceInDays, parse, parseISO, startOfToday, isValid } from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose, DialogDescription } from "@/components/ui/dialog";
import { useAuth } from '@/context/auth-context';
import { tasksService } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Label } from '@/components/ui/label';
import { ShareButton } from './share-button';
import { Separator } from '@/components/ui/separator';
import { Timestamp } from 'firebase/firestore';

interface TaskListProps {
  tasks: Task[];
}

const allCategories: TaskCategory[] = ["personal", "work/school"];

// Moved this function outside the component to make it a pure, stable utility function.
const getDueDateInfo = (dueDateValue: Date | null | undefined) => {
    if (!dueDateValue || !isValid(dueDateValue)) {
      return { priorityClass: '', tooltipText: '' };
    }
    
    const today = startOfToday();
    
    if (isPast(dueDateValue) && !isToday(dueDateValue)) {
        return { priorityClass: 'text-destructive', tooltipText: `Overdue since ${format(dueDateValue, 'MMM d')}`};
    }
    
    const daysUntilDue = differenceInDays(dueDateValue, today);
    if (daysUntilDue === 0) {
        return { priorityClass: 'text-amber-600 dark:text-amber-500', tooltipText: 'Due today' };
    }
    if (daysUntilDue > 0 && daysUntilDue <= 3) {
        return { priorityClass: 'text-sky-600 dark:text-sky-500', tooltipText: `Due in ${daysUntilDue} day(s)`};
    }
    return { priorityClass: '', tooltipText: `Due ${format(dueDateValue, 'MMM d')}`};
};


export function TaskList({ tasks = [] }: TaskListProps) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [newTaskText, setNewTaskText] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskTime, setNewTaskTime] = useState('');
  const [newTaskCategory, setNewTaskCategory] = useState<TaskCategory[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editingText, setEditingText] = useState('');
  const [editingDueDate, setEditingDueDate] = useState('');
  const [editingTime, setEditingTime] = useState('');
  const [editingCategories, setEditingCategories] = useState<TaskCategory[]>([]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newTaskText.trim() === '' || !user || isAdding) return;

    setIsAdding(true);

    const newTask: Omit<Task, 'id'> = {
      text: newTaskText.trim(),
      completed: false,
      createdAt: new Date().toISOString(),
      dueDate: newTaskDueDate ? parseISO(newTaskDueDate) : null,
      time: newTaskTime || null,
      categories: newTaskCategory,
    };

    try {
      await tasksService.add(newTask);
      toast({ title: 'Task Added', description: `"${newTaskText.trim()}" has been added.` });
      setNewTaskText('');
      setNewTaskDueDate('');
      setNewTaskTime('');
      setNewTaskCategory([]);
    } catch (error) {
      console.error("Error adding task: ", error);
      toast({ title: 'Error', description: 'Could not add task. Please check console for details.', variant: 'destructive' });
    } finally {
      setIsAdding(false);
    }
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
    setEditingText(task.text);
    setEditingDueDate(task.dueDate ? format(task.dueDate, 'yyyy-MM-dd') : '');
    setEditingTime(task.time || '');
    setEditingCategories(task.categories || []);
  };

  const handleSaveEdit = async () => {
    if (!editingTask || !user) return;

    const updatedData: Partial<Task> = {
      text: editingText,
      dueDate: editingDueDate ? parseISO(editingDueDate) : null,
      time: editingTime || null,
      categories: editingCategories,
    };

    try {
      await tasksService.update(editingTask.id, updatedData);
      setEditingTask(null);
      toast({ title: 'Task Updated' });
    } catch (error) {
      console.error("Error updating task: ", error);
      toast({ title: 'Error', description: 'Could not update task.', variant: 'destructive' });
    }
  };

  const toggleTaskCompletion = async (id: string, completed: boolean) => {
    if(!user) return;
    try {
      await tasksService.update(id, { completed: !completed, completedAt: !completed ? new Date().toISOString() : null });
    } catch (error) {
       console.error("Error toggling task: ", error);
       toast({ title: 'Error', description: 'Could not update task status.', variant: 'destructive' });
    }
  };

  const handleDeleteTask = async (id: string) => {
    if(!user) return;
    try {
      await tasksService.remove(id);
      toast({ title: 'Task Deleted' });
    } catch (error) {
      console.error("Error deleting task: ", error);
      toast({ title: 'Error', description: 'Could not delete task.', variant: 'destructive' });
    }
  };

  const clearCompletedTasks = async () => {
    if (!user) return;
    try {
        await tasksService.clearCompleted();
        toast({ title: 'Completed tasks cleared' });
    } catch (error) {
        console.error("Error clearing completed tasks: ", error);
        toast({
            title: 'Error',
            description: 'Could not clear completed tasks.',
            variant: 'destructive'
        });
    }
  };
  
  const formatTime = (timeString: string | null) => {
    if (!timeString) return '';
    try {
        return format(parse(timeString, 'HH:mm', new Date()), 'h:mm a');
    } catch (e) {
        return '';
    }
  }

  const sortedIncompleteTasks = tasks
    .filter(task => !task.completed)
    .sort((a, b) => {
        const farFuture = new Date('2999-12-31');
        
        const dateA = a.dueDate || farFuture;
        const dateB = b.dueDate || farFuture;

        if (!isValid(dateA) || !isValid(dateB)) return 0;

        const timeA = a.time ? a.time.replace(':', '') : '0000';
        const timeB = b.time ? b.time.replace(':', '') : '0000';
        
        const combinedA = `${format(dateA, 'yyyyMMdd')}${timeA}`;
        const combinedB = `${format(dateB, 'yyyyMMdd')}${timeB}`;
        
        if (combinedA < combinedB) return -1;
        if (combinedA > combinedB) return 1;

        // If dates and times are the same, sort by creation time
        const creationA = a.createdAt instanceof Date ? a.createdAt : new Date(a.createdAt);
        const creationB = b.createdAt instanceof Date ? b.createdAt : new Date(b.createdAt);
        return creationA.getTime() - creationB.getTime();
    });

  const completedTasks = tasks.filter(task => task.completed);

  const handleCategorySelect = (category: TaskCategory) => {
    const newSelection = newTaskCategory.includes(category)
      ? newTaskCategory.filter((c) => c !== category)
      : [...newTaskCategory, category];
    setNewTaskCategory(newSelection);
  };

  const handleEditingCategorySelect = (category: TaskCategory) => {
    const newSelection = editingCategories.includes(category)
      ? editingCategories.filter((c) => c !== category)
      : [...editingCategories, category];
    setEditingCategories(newSelection);
  }

  const renderTaskItem = (task: Task) => {
      const { priorityClass, tooltipText } = getDueDateInfo(task.dueDate);
      const dueDate = task.dueDate;
      const time = task.time;

      return (
        <div
            key={task.id}
            className="flex items-center gap-3 p-2 rounded-lg group transition-colors hover:bg-muted/50"
        >
            <Checkbox
                id={`task-${task.id}`}
                checked={task.completed}
                onCheckedChange={() => toggleTaskCompletion(task.id, task.completed)}
                aria-label={`Mark "${task.text}" as ${task.completed ? 'incomplete' : 'complete'}`}
            />
            <div className="flex-grow">
                <label
                    htmlFor={`task-${task.id}`}
                    className={cn(
                        'text-sm transition-colors cursor-pointer',
                        task.completed && 'text-muted-foreground line-through'
                    )}
                >
                    {task.text}
                </label>
                <div className="flex items-center gap-2 mt-1">
                    {dueDate && !task.completed && isValid(dueDate) && (
                        <span className={cn('flex items-center gap-1 text-xs text-muted-foreground', priorityClass)}>
                            <CalendarIcon className="h-3 w-3" />
                            <span>{format(dueDate, 'MMM d')}</span>
                        </span>
                    )}
                    {time && !task.completed && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTime(time)}</span>
                        </span>
                    )}
                    {task.categories && task.categories.length > 0 && (
                        <div className="flex gap-1.5">
                            {task.categories.map(cat => (
                                <span key={cat} className="text-xs text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded-sm capitalize">{cat}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <TooltipProvider>
                    <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditTask(task)}>
                                <Pencil className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                            <p>Edit Task</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
                <TooltipProvider>
                     <Tooltip>
                        <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleDeleteTask(task.id)}>
                                <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                             <p>Delete Task</p>
                        </TooltipContent>
                    </Tooltip>
                </TooltipProvider>
            </div>
        </div>
      )
  };

  return (
    <>
      <Card className="flex h-full flex-col">
        <CardHeader>
          <CardTitle>My Tasks</CardTitle>
          <CardDescription>What do you need to get done?</CardDescription>
        </CardHeader>
        <CardContent className="flex-grow p-0">
          <form onSubmit={handleAddTask} className="p-6 border-b space-y-3">
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <Input
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    placeholder="Add a new task..."
                    className="flex-grow"
                    aria-label="New task name"
                    disabled={isAdding}
                />
                 <div className="flex w-full sm:w-auto gap-2">
                    <Input
                        type="date"
                        value={newTaskDueDate}
                        onChange={(e) => setNewTaskDueDate(e.target.value)}
                        className="w-full"
                        aria-label="New task due date"
                        disabled={isAdding}
                    />
                    <Input
                        type="time"
                        value={newTaskTime}
                        onChange={(e) => setNewTaskTime(e.target.value)}
                        className="w-full"
                        aria-label="New task time"
                        disabled={isAdding}
                    />
                 </div>
              </div>
               <div className="space-y-2">
                <Label className="text-sm text-muted-foreground">Category</Label>
                <div className="flex gap-2">
                    {allCategories.map((category) => {
                        const isSelected = newTaskCategory.includes(category);
                        return (
                            <Button
                                key={category}
                                type="button"
                                variant={isSelected ? 'default' : 'outline'}
                                onClick={() => handleCategorySelect(category)}
                                className="capitalize w-full"
                                disabled={isAdding}
                            >
                                {isSelected && <Check className="mr-2 h-4 w-4" />}
                                {category}
                            </Button>
                        )
                    })}
                </div>
              </div>
               <Button type="submit" className="w-full" disabled={isAdding || !newTaskText.trim()}>
                    {isAdding ? (
                        "Adding..."
                    ) : (
                        <>
                            <Plus className="mr-2 h-4 w-4" /> Add Task
                        </>
                    )}
                </Button>
          </form>
          <ScrollArea className="h-[420px]">
            <div className="p-6 space-y-2">
              {sortedIncompleteTasks.length > 0 ? (
                sortedIncompleteTasks.map(renderTaskItem)
              ) : (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending tasks. Add one above to get started!
                </p>
              )}

              {completedTasks.length > 0 && (
                <Collapsible className="pt-4">
                  <CollapsibleTrigger className="flex items-center gap-2 text-sm font-semibold text-muted-foreground w-full group">
                    <Separator className="flex-1"/>
                    <span>Completed ({completedTasks.length})</span>
                    <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-2 pt-2">
                     {completedTasks.map(renderTaskItem)}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </div>
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex items-center justify-between border-t pt-6">
          <Button
              variant="outline"
              size="sm"
              onClick={clearCompletedTasks}
              disabled={completedTasks.length === 0}
          >
              Clear Completed
          </Button>
          <ShareButton tasks={tasks} />
        </CardFooter>
      </Card>

      {editingTask && (
          <Dialog open={!!editingTask} onOpenChange={(isOpen) => !isOpen && setEditingTask(null)}>
              <DialogContent onPointerDownOutside={(e) => e.preventDefault()}>
                  <DialogHeader>
                      <DialogTitle>Edit Task</DialogTitle>
                      <DialogDescription>
                        Make changes to your task here. Click save when you're done.
                      </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                      <div className="grid gap-2">
                          <Label htmlFor="edit-task-text">Task Name</Label>
                          <Input id="edit-task-text" value={editingText} onChange={(e) => setEditingText(e.target.value)} />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="grid gap-2">
                            <Label htmlFor="edit-task-date">Due Date</Label>
                            <Input id="edit-task-date" type="date" value={editingDueDate} onChange={(e) => setEditingDueDate(e.target.value)} />
                          </div>
                           <div className="grid gap-2">
                            <Label htmlFor="edit-task-time">Time</Label>
                            <Input id="edit-task-time" type="time" value={editingTime} onChange={(e) => setEditingTime(e.target.value)} />
                          </div>
                      </div>
                      <div className="grid gap-2">
                          <Label>Categories</Label>
                          <div className="flex gap-2">
                            {allCategories.map((category) => {
                                const isSelected = editingCategories.includes(category);
                                return (
                                    <Button
                                        key={category}
                                        type="button"
                                        variant={isSelected ? 'default' : 'outline'}
                                        onClick={() => handleEditingCategorySelect(category)}
                                        className="capitalize w-full"
                                    >
                                        {isSelected && <Check className="mr-2 h-4 w-4" />}
                                        {category}
                                    </Button>
                                )
                            })}
                        </div>
                      </div>
                  </div>
                  <DialogFooter>
                      <DialogClose asChild>
                          <Button type="button" variant="outline" onClick={() => setEditingTask(null)}>Cancel</Button>
                      </DialogClose>
                      <Button type="submit" onClick={handleSaveEdit}>Save Changes</Button>
                  </DialogFooter>
              </DialogContent>
          </Dialog>
      )}
    </>
  );
}
