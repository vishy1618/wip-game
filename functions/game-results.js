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

export default async function handler(event, context) {

  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: JSON.stringify({ 
        error: 'Method not allowed. Use POST.' 
      })
    };
  }

  // Handle CORS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
      },
      body: ''
    };
  }

  try {
    // Parse request body
    const requestBody = JSON.parse(event.body);
    const { totalTime, averageTime, gameType } = requestBody;

    // Validate required parameters
    if (totalTime === undefined || totalTime === null) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'totalTime is required and must be a number (in seconds)' 
        })
      };
    }

    if (averageTime === undefined || averageTime === null) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'averageTime is required and must be a number (in seconds)' 
        })
      };
    }

    if (!gameType || typeof gameType !== 'string') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'gameType is required and must be a string (multitask or singletask)' 
        })
      };
    }

    // Validate game type values
    if (gameType !== 'multitask' && gameType !== 'singletask') {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'gameType must be either "multitask" or "singletask"' 
        })
      };
    }

    // Validate numeric values
    const totalTimeNum = Number(totalTime);
    const averageTimeNum = Number(averageTime);

    if (isNaN(totalTimeNum) || totalTimeNum < 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'totalTime must be a valid positive number' 
        })
      };
    }

    if (isNaN(averageTimeNum) || averageTimeNum < 0) {
      return {
        statusCode: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: 'averageTime must be a valid positive number' 
        })
      };
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
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        success: true,
        documentId: docRef.id,
        message: 'Game run data saved successfully',
        data: {
          ...gameRunData,
          documentId: docRef.id
        }
      })
    };

  } catch (error) {
    console.error('Error saving game run:', error);
    
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({
        error: 'Internal server error',
        message: error.message
      })
    };
  }
}
