import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import type { PeriodLog, UserProfile } from '../types/period';
import { isValidDateStr, sortLogsDescending } from '../utils/cycleMath';

const USERS_COLLECTION = 'users';
const PERIOD_LOGS_COLLECTION = 'period_logs';

export function subscribeUserProfile(
  uid: string,
  onData: (profile: UserProfile | null) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const path = `${USERS_COLLECTION}/${uid}`;
  const ref = doc(db, USERS_COLLECTION, uid);

  return onSnapshot(
    ref,
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      const data = snapshot.data();
      onData({
        uid: String(data.uid ?? uid),
        email: String(data.email ?? ''),
        defaultCycleLength: Number(data.defaultCycleLength ?? 28),
        defaultPeriodDuration: Number(data.defaultPeriodDuration ?? 5),
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      });
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function upsertUserProfile(
  uid: string,
  email: string,
  defaultCycleLength: number,
  defaultPeriodDuration: number,
  existsAlready: boolean
): Promise<void> {
  const path = `${USERS_COLLECTION}/${uid}`;
  const ref = doc(db, USERS_COLLECTION, uid);
  const safeCycle = Math.min(60, Math.max(15, Math.round(defaultCycleLength)));
  const safeDuration = Math.min(15, Math.max(1, Math.round(defaultPeriodDuration)));

  try {
    if (existsAlready) {
      await updateDoc(ref, {
        email: email.slice(0, 254),
        defaultCycleLength: safeCycle,
        defaultPeriodDuration: safeDuration,
        updatedAt: serverTimestamp(),
      });
    } else {
      await setDoc(ref, {
        uid,
        email: email.slice(0, 254),
        defaultCycleLength: safeCycle,
        defaultPeriodDuration: safeDuration,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  } catch (error) {
    handleFirestoreError(error, existsAlready ? OperationType.UPDATE : OperationType.CREATE, path);
  }
}

export function subscribePeriodLogs(
  uid: string,
  onData: (logs: PeriodLog[]) => void,
  onError?: (error: Error) => void
): Unsubscribe {
  const q = query(collection(db, PERIOD_LOGS_COLLECTION), where('user_id', '==', uid));

  return onSnapshot(
    q,
    (snapshot) => {
      const items: PeriodLog[] = snapshot.docs.map((d) => {
        const data = d.data();
        return {
          id: d.id,
          user_id: String(data.user_id),
          start_date: String(data.start_date),
          end_date: data.end_date ? String(data.end_date) : null,
          created_at: data.created_at,
          updated_at: data.updated_at,
        };
      });
      onData(sortLogsDescending(items));
    },
    (error) => {
      try {
        handleFirestoreError(error, OperationType.LIST, PERIOD_LOGS_COLLECTION);
      } catch (wrapped) {
        onError?.(wrapped instanceof Error ? wrapped : new Error(String(wrapped)));
      }
    }
  );
}

export async function createPeriodLog(
  uid: string,
  startDate: string,
  endDate: string | null
): Promise<string> {
  if (!isValidDateStr(startDate)) {
    throw new Error('Please choose a valid start date.');
  }
  if (endDate !== null) {
    if (!isValidDateStr(endDate)) {
      throw new Error('Please choose a valid end date.');
    }
    if (endDate < startDate) {
      throw new Error('End date cannot be earlier than start date.');
    }
  }

  try {
    const docRef = await addDoc(collection(db, PERIOD_LOGS_COLLECTION), {
      user_id: uid,
      start_date: startDate,
      end_date: endDate,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, PERIOD_LOGS_COLLECTION);
  }
}

export async function updatePeriodLog(
  logId: string,
  startDate: string,
  endDate: string | null
): Promise<void> {
  if (!isValidDateStr(startDate)) {
    throw new Error('Please choose a valid start date.');
  }
  if (endDate !== null) {
    if (!isValidDateStr(endDate)) {
      throw new Error('Please choose a valid end date.');
    }
    if (endDate < startDate) {
      throw new Error('End date cannot be earlier than start date.');
    }
  }

  const path = `${PERIOD_LOGS_COLLECTION}/${logId}`;
  try {
    await updateDoc(doc(db, PERIOD_LOGS_COLLECTION, logId), {
      start_date: startDate,
      end_date: endDate,
      updated_at: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

export async function deletePeriodLog(logId: string): Promise<void> {
  const path = `${PERIOD_LOGS_COLLECTION}/${logId}`;
  try {
    await deleteDoc(doc(db, PERIOD_LOGS_COLLECTION, logId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
