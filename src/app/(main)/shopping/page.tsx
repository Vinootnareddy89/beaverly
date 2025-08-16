
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { ShoppingListItem } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { shoppingListService } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function ShoppingListPage() {
  const { user, loading } = useAuth();
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [newItemText, setNewItemText] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user) {
      const unsubscribe = shoppingListService.onUpdate(setItems);
      return () => unsubscribe();
    }
  }, [isMounted, user]);

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newItemText.trim() === '') return;
    const newItem: Omit<ShoppingListItem, 'id'> = {
      text: newItemText.trim(),
      completed: false,
    };
    try {
      await shoppingListService.add(newItem);
      setNewItemText('');
    } catch (error) {
       toast({ title: 'Error', description: 'Could not add item.', variant: 'destructive' });
    }
  };

  const toggleItemCompletion = async (id: string, completed: boolean) => {
    if(!user) return;
    await shoppingListService.update(id, { completed: !completed });
  };
  
  const deleteItem = async (id: string) => {
    if(!user) return;
    await shoppingListService.remove(id);
  };

  const clearCompletedItems = async () => {
    if (!user) return;
    try {
      await shoppingListService.clearCompleted();
      toast({ title: 'Completed items cleared' });
    } catch (error) {
      console.error("Error clearing completed items: ", error);
      toast({ 
          title: 'Error', 
          description: 'Could not clear completed items.', 
          variant: 'destructive' 
      });
    }
  };
  
  if (!isMounted || loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-64 mt-2" />
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Skeleton className="h-10 flex-grow" />
            <Skeleton className="h-10 w-10" />
          </div>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const incompleteItems = items.filter(item => !item.completed);
  const completedItems = items.filter(item => item.completed);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Shopping List</CardTitle>
        <CardDescription>Keep track of what you need to buy.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleAddItem} className="flex gap-2 mb-4">
          <Input
            value={newItemText}
            onChange={(e) => setNewItemText(e.target.value)}
            placeholder="Add an item..."
          />
          <Button type="submit" size="icon">
            <Plus />
          </Button>
        </form>
        <ScrollArea className="h-[calc(100vh-350px)] pr-4">
            <h3 className="text-sm font-medium text-muted-foreground mb-2">To Buy</h3>
            {incompleteItems.length > 0 ? (
                incompleteItems.map((item) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-3 p-2 rounded-md hover:bg-muted/50 group"
                    >
                        <Checkbox
                            id={`item-${item.id}`}
                            checked={item.completed}
                            onCheckedChange={() => toggleItemCompletion(item.id, item.completed)}
                        />
                        <label
                            htmlFor={`item-${item.id}`}
                            className={cn(
                                'flex-grow text-sm',
                                item.completed && 'text-muted-foreground line-through'
                            )}
                        >
                            {item.text}
                        </label>
                        <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteItem(item.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))
            ) : (
                <p className="text-sm text-muted-foreground text-center py-4">Your shopping list is empty.</p>
            )}

            {completedItems.length > 0 && <h3 className="text-sm font-medium text-muted-foreground mt-4 mb-2">Completed</h3>}
            {completedItems.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-2 rounded-md group">
                    <Checkbox
                        id={`item-${item.id}`}
                        checked={item.completed}
                        onCheckedChange={() => toggleItemCompletion(item.id, item.completed)}
                    />
                    <label
                        htmlFor={`item-${item.id}`}
                        className={cn(
                            'flex-grow text-sm',
                            item.completed && 'text-muted-foreground line-through'
                        )}
                    >
                        {item.text}
                    </label>
                    <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteItem(item.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                </div>
            ))}
        </ScrollArea>
      </CardContent>
      {completedItems.length > 0 && (
          <CardFooter className="border-t pt-4">
               <Button
                    variant="outline"
                    size="sm"
                    onClick={clearCompletedItems}
                    disabled={completedItems.length === 0}
                >
                    Clear Completed
                </Button>
          </CardFooter>
      )}
    </Card>
  );
}
