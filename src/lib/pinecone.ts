/**
 * @fileOverview Pinecone configuration and helper functions
 */

import { Pinecone } from '@pinecone-database/pinecone';

let pineconeClient: Pinecone | null = null;

export async function getPineconeClient(): Promise<Pinecone> {
  if (!pineconeClient) {
    const apiKey = process.env.PINECONE_API_KEY;
    if (!apiKey) {
      throw new Error('PINECONE_API_KEY environment variable is not set');
    }
    
    pineconeClient = new Pinecone({
      apiKey: apiKey,
    });
  }
  
  return pineconeClient;
}

// Pinecone index configuration
export const PINECONE_INDEX_NAME = 'proctorlink';
export const PINECONE_DIMENSIONS = 3072; // Match your Pinecone index configuration

export async function getPineconeIndex(indexName: string = PINECONE_INDEX_NAME) {
  const client = await getPineconeClient();
  return client.index(indexName);
}

