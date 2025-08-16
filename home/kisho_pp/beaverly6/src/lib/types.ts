
import type { Timestamp } from 'firebase/firestore';

export type TaskCategory = 'personal' | 'work/school';

export type Task = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: Date | Timestamp;
  completedAt?: Date | Timestamp | null;
  dueDate?: Date | Timestamp | null;
  isRecurring?: boolean;
  recurrenceRule?: string; // e.g., '{"interval": "weeks", "value": 1}'
  nextDueDate?: Date | Timestamp | null;
  categories?: TaskCategory[];
};

export type Bill = {
  id: string;
  name: string;
  amount: number;
  dueDate: string; // ISO date string
  isPaid: boolean;
  isRecurring?: boolean;
};

export type Habit = {
  id: string;
  name: string;
  icon: string;
  completions: Record<string, boolean>; // e.g. { '2023-10-27': true }
};

export type Event = {
  id: string;
  text: string;
  date: string; // yyyy-MM-dd
};

export type ShoppingListItem = {
  id: string;
  text: string;
  completed: boolean;
};

export type Memo = {
    id: string;
    audioUrl: string;
    storagePath: string; // The path to the file in Firebase Storage
    createdAt: Date | Timestamp;
};

export type Reminder = {
  id:string;
  text: string;
  date: string; // yyyy-MM-dd
};
