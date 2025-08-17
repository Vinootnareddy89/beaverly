
"use client";

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, Banknote, Calendar as CalendarIcon, Repeat } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, parseISO, isPast, addMonths } from 'date-fns';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { Bill } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/context/auth-context';
import { billsService } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function BillsPage() {
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [bills, setBills] = useState<Bill[]>([]);
  const [newBillName, setNewBillName] = useState('');
  const [newBillAmount, setNewBillAmount] = useState('');
  const [newBillDueDate, setNewBillDueDate] = useState('');
  const [newBillIsRecurring, setNewBillIsRecurring] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && user) {
      const unsubscribe = billsService.onUpdate(setBills);
      return () => unsubscribe();
    }
  }, [isMounted, user]);

  const handleAddBill = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || newBillName.trim() === '' || newBillAmount.trim() === '' || newBillDueDate.trim() === '') {
        toast({
            title: 'Missing Information',
            description: 'Please fill out all fields to add a new bill.',
            variant: 'destructive',
        });
        return;
    }

    const newBill: Omit<Bill, 'id'> = {
      name: newBillName.trim(),
      amount: parseFloat(newBillAmount),
      dueDate: new Date(newBillDueDate).toISOString(),
      isPaid: false,
      isRecurring: newBillIsRecurring,
    };

    try {
        await billsService.add(newBill);
        toast({ title: "Bill Added", description: `${newBill.name} has been added.`});
        setNewBillName('');
        setNewBillAmount('');
        setNewBillDueDate('');
        setNewBillIsRecurring(false);
    } catch (error) {
        console.error("Error adding bill:", error);
        toast({
            title: 'Error',
            description: 'Could not add the bill.',
            variant: 'destructive',
        });
    }
  };

  const toggleBillPaid = async (bill: Bill) => {
    if (!user) return;
    
    await billsService.update(bill.id, { isPaid: !bill.isPaid });

    if (!bill.isPaid && bill.isRecurring) {
        const nextDueDate = addMonths(parseISO(bill.dueDate), 1);
        const nextBill: Omit<Bill, 'id'> = {
          name: bill.name,
          amount: bill.amount,
          dueDate: nextDueDate.toISOString(),
          isPaid: false,
          isRecurring: bill.isRecurring,
        };
        await billsService.add(nextBill);
    }
  };
  
  const deleteBill = async (id: string) => {
    if(!user) return;
    await billsService.remove(id);
  };

  if (!isMounted || loading) {
    return (
      <div className="space-y-8">
        <Card>
          <CardHeader>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
              <Skeleton className="h-10 sm:col-span-2" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10 sm:col-span-4" />
            </div>
          </CardContent>
        </Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  const upcomingBills = bills.filter(bill => !bill.isPaid).sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  const paidBills = bills.filter(bill => bill.isPaid).sort((a, b) => new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime());

  const upcomingTotal = upcomingBills.reduce((total, bill) => total + bill.amount, 0);
  const paidTotal = paidBills.reduce((total, bill) => total + bill.amount, 0);

  return (
    <TooltipProvider>
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Add New Bill</CardTitle>
          <CardDescription>Keep track of your upcoming payments.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddBill} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-end">
            <div className="sm:col-span-2 grid gap-1.5">
                <Label htmlFor="bill-name">Bill Name</Label>
                <Input
                id="bill-name"
                value={newBillName}
                onChange={(e) => setNewBillName(e.target.value)}
                placeholder="e.g., Internet"
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="bill-amount">Amount</Label>
                <Input
                id="bill-amount"
                value={newBillAmount}
                onChange={(e) => setNewBillAmount(e.target.value)}
                placeholder="$50.00"
                type="number"
                />
            </div>
            <div className="grid gap-1.5">
                <Label htmlFor="bill-due-date">Due Date</Label>
                <Input
                id="bill-due-date"
                value={newBillDueDate}
                onChange={(e) => setNewBillDueDate(e.target.value)}
                type="date"
                />
            </div>
            <div className="flex items-center space-x-2 sm:col-span-4">
                <Checkbox id="recurring" checked={newBillIsRecurring} onCheckedChange={(checked) => setNewBillIsRecurring(checked as boolean)} />
                <Label htmlFor="recurring" className="font-normal">This is a monthly recurring bill</Label>
            </div>
            <Button type="submit" className="sm:col-span-4 w-full">
              <Plus className="mr-2 h-4 w-4" /> Add Bill
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Bills</CardTitle>
            <CardDescription>You have {upcomingBills.length} upcoming bills totaling ${upcomingTotal.toFixed(2)}.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {upcomingBills.length > 0 ? (
                upcomingBills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/50 group">
                    <Checkbox
                      id={`bill-${bill.id}`}
                      checked={bill.isPaid}
                      onCheckedChange={() => toggleBillPaid(bill)}
                    />
                    <div className="flex-grow">
                      <label htmlFor={`bill-${bill.id}`} className="font-semibold flex items-center gap-2">
                        {bill.name}
                        {bill.isRecurring && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Repeat className="h-4 w-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Recurring</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </label>
                      <div className="flex items-center text-sm text-muted-foreground gap-4">
                          <div className="flex items-center gap-1">
                            <Banknote className="h-4 w-4" />
                            <span>${bill.amount.toFixed(2)}</span>
                          </div>
                          <div className={cn("flex items-center gap-1", isPast(parseISO(bill.dueDate)) && !isPast(new Date()) && "text-destructive")}>
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(parseISO(bill.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                      </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteBill(bill.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming bills. You&apos;re all caught up!</p>
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Paid Bills</CardTitle>
            <CardDescription>You have paid {paidBills.length} bills totaling ${paidTotal.toFixed(2)}.</CardDescription>
          </CardHeader>
          <CardContent>
             <div className="space-y-4">
              {paidBills.length > 0 ? (
                paidBills.map((bill) => (
                  <div key={bill.id} className="flex items-center gap-4 p-3 rounded-lg group">
                    <Checkbox
                      id={`bill-${bill.id}`}
                      checked={bill.isPaid}
                      onCheckedChange={() => toggleBillPaid(bill)}
                    />
                    <div className="flex-grow">
                       <label
                        htmlFor={`bill-${bill.id}`}
                        className="text-muted-foreground line-through flex items-center gap-2"
                      >
                        {bill.name}
                        {bill.isRecurring && (
                          <Tooltip>
                            <TooltipTrigger>
                              <Repeat className="h-4 w-4" />
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Recurring</p>
                            </TooltipContent>
                          </Tooltip>
                        )}
                      </label>
                      <div className="flex items-center text-sm text-muted-foreground/80 gap-4">
                          <div className="flex items-center gap-1">
                            <Banknote className="h-4 w-4" />
                            <span>${bill.amount.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <CalendarIcon className="h-4 w-4" />
                            <span>{format(parseISO(bill.dueDate), 'MMM d, yyyy')}</span>
                          </div>
                      </div>
                    </div>
                     <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => deleteBill(bill.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No paid bills yet.</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
    </TooltipProvider>
  );
}
