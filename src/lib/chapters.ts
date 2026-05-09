/**
 * @fileOverview Firestore helpers for chapter data management
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';
import { GenerateChaptersOutput } from '@/ai/flows/generate-chapters';
import { GenerateChapterContentOutput } from '@/ai/flows/generate-chapter-content';

export interface Chapter {
  id?: string;
  pathId: string;
  weekNumber: number;
  title: string;
  description: string;
  order: number;
  content?: GenerateChapterContentOutput;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

const COLLECTION_NAME = 'chapters';

/**
 * Create chapters for a week
 */
export async function createChapters(
  pathId: string,
  weekNumber: number,
  chapters: GenerateChaptersOutput['chapters']
): Promise<string[]> {
  const chapterIds: string[] = [];
  
  for (const chapter of chapters) {
    const chapterRef = doc(collection(db, COLLECTION_NAME));
    const chapterData: Omit<Chapter, 'id'> = {
      pathId,
      weekNumber,
      title: chapter.title,
      description: chapter.description,
      order: chapter.order,
      createdAt: serverTimestamp() as Timestamp,
      updatedAt: serverTimestamp() as Timestamp,
    };
    
    await setDoc(chapterRef, chapterData);
    chapterIds.push(chapterRef.id);
  }
  
  return chapterIds;
}

/**
 * Get chapters for a specific week
 */
export async function getWeekChapters(
  pathId: string,
  weekNumber: number
): Promise<Chapter[]> {
  // Query without orderBy to avoid needing a composite index
  // We'll sort in memory instead
  const q = query(
    collection(db, COLLECTION_NAME),
    where('pathId', '==', pathId),
    where('weekNumber', '==', weekNumber)
  );

  const querySnapshot = await getDocs(q);
  const chapters = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Chapter[];
  
  // Sort by order in memory
  return chapters.sort((a, b) => a.order - b.order);
}

/**
 * Get a single chapter by ID
 */
export async function getChapter(chapterId: string): Promise<Chapter | null> {
  const chapterRef = doc(db, COLLECTION_NAME, chapterId);
  const chapterSnap = await getDoc(chapterRef);

  if (!chapterSnap.exists()) {
    return null;
  }

  return {
    id: chapterSnap.id,
    ...chapterSnap.data(),
  } as Chapter;
}

/**
 * Update chapter content
 */
export async function updateChapterContent(
  chapterId: string,
  content: GenerateChapterContentOutput
): Promise<void> {
  const chapterRef = doc(db, COLLECTION_NAME, chapterId);
  await updateDoc(chapterRef, {
    content,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Get all chapters for a learning path
 */
export async function getPathChapters(pathId: string): Promise<Chapter[]> {
  // Query without orderBy to avoid needing a composite index
  // We'll sort in memory instead
  const q = query(
    collection(db, COLLECTION_NAME),
    where('pathId', '==', pathId)
  );

  const querySnapshot = await getDocs(q);
  const chapters = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as Chapter[];
  
  // Sort by weekNumber first, then by order
  return chapters.sort((a, b) => {
    if (a.weekNumber !== b.weekNumber) {
      return a.weekNumber - b.weekNumber;
    }
    return a.order - b.order;
  });
}

