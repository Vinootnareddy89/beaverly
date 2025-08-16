// Import the functions you need from the SDKs you need
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { 
  getFirestore, 
  Timestamp,
  collection,
  query,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  writeBatch,
  getDocs,
  doc,
  where,
  QueryConstraint,
  orderBy,
} from "firebase/firestore";
import { getStorage, ref, deleteObject } from "firebase/storage";
import { firebaseConfig } from "./firebase-config";
import type { Task, Bill, Habit, Reminder, ShoppingListItem, Event, Memo } from './types';

// Initialize Firebase
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);

// Helper to convert Firestore Timestamps to JS Dates in a document's data
const convertDocumentTimestamps = (data: any): any => {
    if (!data) return data;
    const newData: { [key: string]: any } = {};
    for (const key in data) {
        const value = data[key];
        if (value instanceof Timestamp) {
            newData[key] = value.toDate();
        } else if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // Recursively convert timestamps in nested objects
            newData[key] = convertDocumentTimestamps(value);
        } else {
            newData[key] = value;
        }
    }
    return newData;
};

// --- Generic Service Factory ---

type DocumentWithId = { id: string };

const createBaseService = <T extends DocumentWithId>(
  collectionName: string,
  ...defaultQueryConstraints: QueryConstraint[]
) => {
  const onUpdate = (callback: (items: T[]) => void) => {
    const user = auth.currentUser;
    if (!user) {
      console.warn(`[${collectionName} service] User not authenticated. Skipping subscription.`);
      // Return a no-op unsubscribe function
      return () => {};
    }
    
    const userItemsRef = collection(db, 'users', user.uid, collectionName);
    const q = query(userItemsRef, ...defaultQueryConstraints);

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const items = snapshot.docs.map(doc => ({
            id: doc.id,
            ...convertDocumentTimestamps(doc.data()),
        } as T));
        callback(items);
    }, (error) => {
        console.error(`[${collectionName} service] Error on snapshot: `, error);
    });

    return unsubscribe;
  };

  const add = (item: Omit<T, 'id'>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return addDoc(collection(db, 'users', user.uid, collectionName), item);
  };

  const update = (id: string, updates: Partial<Omit<T, 'id'>>) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return updateDoc(doc(db, 'users', user.uid, collectionName, id), updates);
  };

  const remove = (id: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return deleteDoc(doc(db, 'users', user.uid, collectionName, id));
  };
  
  const clearCompleted = async () => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    
    const userItemsRef = collection(db, 'users', user.uid, collectionName);
    const q = query(userItemsRef, where('completed', '==', true));
    
    const querySnapshot = await getDocs(q);
    const batch = writeBatch(db);
    querySnapshot.forEach((doc) => batch.delete(doc.ref));
    return batch.commit();
  }

  return { onUpdate, add, update, remove, clearCompleted };
};


// --- Service Definitions ---

export const tasksService = createBaseService<Task>('tasks');
export const shoppingListService = createBaseService<ShoppingListItem>('shopping-list');
export const billsService = createBaseService<Bill>('bills');
export const habitsService = createBaseService<Habit>('habits');
export const remindersService = createBaseService<Reminder>('reminders');
export const eventsService = createBaseService<Event>('events');

export const memosService = {
  ...createBaseService<Memo>('memos', orderBy('createdAt', 'desc')),
  remove: async (memoId: string, storagePath: string) => {
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");

    // Delete the file from Cloud Storage
    if (storagePath) {
        const storageRef = ref(storage, storagePath);
        try {
            await deleteObject(storageRef);
        } catch (error: any) {
            // It's okay if the object doesn't exist, we can proceed to delete the firestore doc
            if (error.code !== 'storage/object-not-found') {
                console.error("Error deleting storage object:", storagePath, error);
                throw error; // Re-throw if it's not a 'not found' error
            }
        }
    }
    // Delete the document from Firestore
    return deleteDoc(doc(db, 'users', user.uid, 'memos', memoId));
  },
};
