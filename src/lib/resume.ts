/**
 * @fileOverview Firestore helpers for resume data
 */

import { db } from './firebase';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  serverTimestamp,
  Timestamp,
} from 'firebase/firestore';

export interface ResumeReview {
  id?: string;
  userId: string;
  fileName: string;
  originalText: string;
  parsedText: string;
  metadata: {
    pageCount: number;
    fileSize: number;
  };
  embeddingsGenerated: boolean;
  pineconeIndexed: boolean;
  createdAt: Timestamp | Date;
  updatedAt: Timestamp | Date;
}

export interface ResumeChatMessage {
  id?: string;
  resumeId: string;
  userId: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Timestamp | Date;
}

const RESUMES_COLLECTION = 'resumeReviews';
const CHAT_MESSAGES_COLLECTION = 'resumeChatMessages';

/**
 * Create a new resume review
 */
export async function createResumeReview(
  userId: string,
  fileName: string,
  originalText: string,
  parsedText: string,
  metadata: { pageCount: number; fileSize: number }
): Promise<string> {
  const resumeRef = doc(collection(db, RESUMES_COLLECTION));
  
  const resumeReview: Omit<ResumeReview, 'id'> = {
    userId,
    fileName,
    originalText,
    parsedText,
    metadata,
    embeddingsGenerated: false,
    pineconeIndexed: false,
    createdAt: serverTimestamp() as Timestamp,
    updatedAt: serverTimestamp() as Timestamp,
  };

  await setDoc(resumeRef, resumeReview);
  return resumeRef.id;
}

/**
 * Get a resume review by ID
 */
export async function getResumeReview(resumeId: string): Promise<ResumeReview | null> {
  const resumeRef = doc(db, RESUMES_COLLECTION, resumeId);
  const resumeSnap = await getDoc(resumeRef);

  if (!resumeSnap.exists()) {
    return null;
  }

  return {
    id: resumeSnap.id,
    ...resumeSnap.data(),
  } as ResumeReview;
}

/**
 * Get all resume reviews for a user
 */
export async function getUserResumeReviews(userId: string): Promise<ResumeReview[]> {
  const q = query(
    collection(db, RESUMES_COLLECTION),
    where('userId', '==', userId)
  );

  const querySnapshot = await getDocs(q);
  const resumes = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ResumeReview[];
  
  // Sort by createdAt descending
  return resumes.sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                  (a.createdAt as Timestamp)?.toMillis() || 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                  (b.createdAt as Timestamp)?.toMillis() || 0;
    return bTime - aTime;
  });
}

/**
 * Update resume review embeddings status
 */
export async function updateResumeEmbeddingsStatus(
  resumeId: string,
  embeddingsGenerated: boolean,
  pineconeIndexed: boolean
): Promise<void> {
  const resumeRef = doc(db, RESUMES_COLLECTION, resumeId);
  await updateDoc(resumeRef, {
    embeddingsGenerated,
    pineconeIndexed,
    updatedAt: serverTimestamp(),
  });
}

/**
 * Add a chat message
 */
export async function addChatMessage(
  resumeId: string,
  userId: string,
  role: 'user' | 'assistant',
  content: string
): Promise<string> {
  const messageRef = doc(collection(db, CHAT_MESSAGES_COLLECTION));
  
  const message: Omit<ResumeChatMessage, 'id'> = {
    resumeId,
    userId,
    role,
    content,
    createdAt: serverTimestamp() as Timestamp,
  };

  await setDoc(messageRef, message);
  return messageRef.id;
}

/**
 * Delete a resume review and all associated chat messages
 */
export async function deleteResumeReview(resumeId: string, userId: string): Promise<void> {
  // Verify the resume belongs to the user
  const resume = await getResumeReview(resumeId);
  if (!resume) {
    throw new Error('Resume not found');
  }
  
  if (resume.userId !== userId) {
    throw new Error('Unauthorized: You can only delete your own resumes');
  }
  
  // Delete all chat messages for this resume
  const chatQuery = query(
    collection(db, CHAT_MESSAGES_COLLECTION),
    where('resumeId', '==', resumeId)
  );
  
  const chatSnapshot = await getDocs(chatQuery);
  const deleteChatPromises = chatSnapshot.docs.map(doc => deleteDoc(doc.ref));
  await Promise.all(deleteChatPromises);
  
  // Delete the resume
  const resumeRef = doc(db, RESUMES_COLLECTION, resumeId);
  await deleteDoc(resumeRef);
}

/**
 * Get chat messages for a resume
 */
export async function getResumeChatMessages(resumeId: string): Promise<ResumeChatMessage[]> {
  const q = query(
    collection(db, CHAT_MESSAGES_COLLECTION),
    where('resumeId', '==', resumeId)
  );

  const querySnapshot = await getDocs(q);
  const messages = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as ResumeChatMessage[];
  
  // Sort by createdAt ascending
  return messages.sort((a, b) => {
    const aTime = a.createdAt instanceof Date ? a.createdAt.getTime() : 
                  (a.createdAt as Timestamp)?.toMillis() || 0;
    const bTime = b.createdAt instanceof Date ? b.createdAt.getTime() : 
                  (b.createdAt as Timestamp)?.toMillis() || 0;
    return aTime - bTime;
  });
}

