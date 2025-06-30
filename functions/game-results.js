import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Initialize Firebase Admin SDK
const firebaseConfig = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID,
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: process.env.FIREBASE_CLIENT_X509_CERT_URL
};

const app = initializeApp({
  credential: cert(firebaseConfig)
});

const db = getFirestore(app);

export default async function handler(request, response) {
  // Set CORS headers
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  response.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Only allow POST requests
  if (request.method !== 'POST') {
    response.status(405).json({ 
      error: 'Method not allowed. Use POST.' 
    });
    return;
  }

  try {
    // Parse request body
    const { totalTime, averageTime, gameType } = request.body;

    // Validate required parameters
    if (totalTime === undefined || totalTime === null) {
      response.status(400).json({ 
        error: 'totalTime is required and must be a number (in seconds)' 
      });
      return;
    }

    if (averageTime === undefined || averageTime === null) {
      response.status(400).json({ 
        error: 'averageTime is required and must be a number (in seconds)' 
      });
      return;
    }

    if (!gameType || typeof gameType !== 'string') {
      response.status(400).json({ 
        error: 'gameType is required and must be a string (multitask or singletask)' 
      });
      return;
    }

    // Validate game type values
    if (gameType !== 'multitask' && gameType !== 'singletask') {
      response.status(400).json({ 
        error: 'gameType must be either "multitask" or "singletask"' 
      });
      return;
    }

    // Validate numeric values
    const totalTimeNum = Number(totalTime);
    const averageTimeNum = Number(averageTime);

    if (isNaN(totalTimeNum) || totalTimeNum < 0) {
      response.status(400).json({ 
        error: 'totalTime must be a valid positive number' 
      });
      return;
    }

    if (isNaN(averageTimeNum) || averageTimeNum < 0) {
      response.status(400).json({ 
        error: 'averageTime must be a valid positive number' 
      });
      return;
    }

    // Prepare document data
    const gameRunData = {
      totalTime: totalTimeNum,
      averageTime: averageTimeNum,
      gameType: gameType,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    };

    // Save to Firestore
    const docRef = await db.collection('gameruns').add(gameRunData);

    // Return success response
    response.status(200).json({
      success: true,
      documentId: docRef.id,
      message: 'Game run data saved successfully',
      data: {
        ...gameRunData,
        documentId: docRef.id
      }
    });

  } catch (error) {
    console.error('Error saving game run:', error);
    
    response.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
