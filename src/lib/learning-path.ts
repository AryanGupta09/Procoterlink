/**
 * @fileOverview Firestore helpers for learning path data management
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
import { GenerateLearningPathOutput } from '@/ai/flows/generate-learning-path';

export interface LearningPathWeek {
  week: number;
  topics: string[];
  resources: string[];
  milestones?: string[];
  completed?: boolean;
}

export interface LearningPath {
  id?: string;
  userId: string;
  goal: string;
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  hoursPerWeek: number;
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed';
  roadmap: GenerateLearningPathOutput;
  progress: number; // 0-100
  completedWeeks: number[];
  lastUpdated: Timestamp | Date;
  createdAt: Timestamp | Date;
}

const COLLECTION_NAME = 'learningPaths';

/**
 * Create a new learning path
 */
export async function createLearningPath(
  userId: string,
  goal: string,
  skillLevel: 'beginner' | 'intermediate' | 'advanced',
  hoursPerWeek: number,
  learningStyle: 'visual' | 'hands-on' | 'reading' | 'mixed',
  roadmap: GenerateLearningPathOutput
): Promise<string> {
  const learningPathRef = doc(collection(db, COLLECTION_NAME));
  
  const learningPath: Omit<LearningPath, 'id'> = {
    userId,
    goal,
    skillLevel,
    hoursPerWeek,
    learningStyle,
    roadmap,
    progress: 0,
    completedWeeks: [],
    lastUpdated: serverTimestamp() as Timestamp,
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(learningPathRef, learningPath);
  return learningPathRef.id;
}

/**
 * Get a learning path by ID
 */
export async function getLearningPath(pathId: string): Promise<LearningPath | null> {
  const pathRef = doc(db, COLLECTION_NAME, pathId);
  const pathSnap = await getDoc(pathRef);

  if (!pathSnap.exists()) {
    return null;
  }

  return {
    id: pathSnap.id,
    ...pathSnap.data(),
  } as LearningPath;
}

/**
 * Get all learning paths for a user
 */
export async function getUserLearningPaths(userId: string): Promise<LearningPath[]> {
  // Query without orderBy to avoid needing a composite index
  // We'll sort in memory instead
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const paths = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as LearningPath[];
  
  // Sort by createdAt descending in memory
  return paths.sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                  (a.createdAt as Timestamp)?.toMillis() || 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                  (b.createdAt as Timestamp)?.toMillis() || 0;
    return bTime - aTime;
  });
}

/**
 * Update learning path progress
 */
export async function updateLearningPathProgress(
  pathId: string,
  completedWeeks: number[],
  progress: number
): Promise<void> {
  const pathRef = doc(db, COLLECTION_NAME, pathId);
  await updateDoc(pathRef, {
    completedWeeks,
    progress: Math.min(100, Math.max(0, progress)),
    lastUpdated: serverTimestamp(),
  });
}

/**
 * Update a specific week's completion status
 */
export async function toggleWeekCompletion(
  pathId: string,
  weekNumber: number,
  isCompleted: boolean
): Promise<void> {
  const path = await getLearningPath(pathId);
  if (!path) {
    throw new Error('Learning path not found');
  }

  let completedWeeks = [...path.completedWeeks];
  if (isCompleted && !completedWeeks.includes(weekNumber)) {
    completedWeeks.push(weekNumber);
  } else if (!isCompleted && completedWeeks.includes(weekNumber)) {
    completedWeeks = completedWeeks.filter(w => w !== weekNumber);
  }

  const totalWeeks = path.roadmap.weeks.length;
  const progress = Math.round((completedWeeks.length / totalWeeks) * 100);

  await updateLearningPathProgress(pathId, completedWeeks, progress);
}

