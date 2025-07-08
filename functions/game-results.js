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
  response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');

  // Handle CORS preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  if (request.method === 'GET') {
    try {
      // Fetch all game runs
      const snapshot = await db.collection('gameruns').get();
      
      if (snapshot.empty) {
        response.status(200).json({
          multitask: { count: 0, avgTotalTime: 0, avgAverageTime: 0 },
          singletask: { count: 0, avgTotalTime: 0, avgAverageTime: 0 },
          wip: { count: 0, avgTotalTime: 0, avgAverageTime: 0, avgWIP: 0 },
          comparison: { totalTimePercentage: 0, averageTimePercentage: 0 }
        });
        return;
      }

      // Separate data by game type
      const multitaskRuns = [];
      const singletaskRuns = [];

      const wipRuns = [];
      
      snapshot.docs.forEach(doc => {
        const data = doc.data();
        if (data.gameType === 'multitask') {
          multitaskRuns.push(data);
        } else if (data.gameType === 'singletask') {
          singletaskRuns.push(data);
        } else if (data.gameType === 'wip') {
          wipRuns.push(data);
        }
      });

      // Calculate averages for multitask
      const multitaskStats = {
        count: multitaskRuns.length,
        avgTotalTime: multitaskRuns.length > 0 
          ? multitaskRuns.reduce((sum, run) => sum + run.totalTime, 0) / multitaskRuns.length 
          : 0,
        avgAverageTime: multitaskRuns.length > 0 
          ? multitaskRuns.reduce((sum, run) => sum + run.averageTime, 0) / multitaskRuns.length 
          : 0
      };

      // Calculate averages for singletask
      const singletaskStats = {
        count: singletaskRuns.length,
        avgTotalTime: singletaskRuns.length > 0 
          ? singletaskRuns.reduce((sum, run) => sum + run.totalTime, 0) / singletaskRuns.length 
          : 0,
        avgAverageTime: singletaskRuns.length > 0 
          ? singletaskRuns.reduce((sum, run) => sum + run.averageTime, 0) / singletaskRuns.length 
          : 0
      };

      // Calculate averages for WIP
      const wipStats = {
        count: wipRuns.length,
        avgTotalTime: wipRuns.length > 0 
          ? wipRuns.reduce((sum, run) => sum + run.totalTime, 0) / wipRuns.length 
          : 0,
        avgAverageTime: wipRuns.length > 0 
          ? wipRuns.reduce((sum, run) => sum + run.averageTime, 0) / wipRuns.length 
          : 0,
        avgWIP: wipRuns.length > 0 
          ? wipRuns.reduce((sum, run) => sum + (run.averageWIP || 0), 0) / wipRuns.length 
          : 0
      };

      // Calculate comparison percentages (positive means multitask is faster)
      let totalTimePercentage = 0;
      let averageTimePercentage = 0;

      if (multitaskStats.avgTotalTime > 0 && singletaskStats.avgTotalTime > 0) {
        totalTimePercentage = ((singletaskStats.avgTotalTime - multitaskStats.avgTotalTime) / singletaskStats.avgTotalTime) * 100;
      }

      if (multitaskStats.avgAverageTime > 0 && singletaskStats.avgAverageTime > 0) {
        averageTimePercentage = ((singletaskStats.avgAverageTime - multitaskStats.avgAverageTime) / singletaskStats.avgAverageTime) * 100;
      }

      response.status(200).json({
        multitask: multitaskStats,
        singletask: singletaskStats,
        wip: wipStats,
        comparison: {
          totalTimePercentage: Math.round(totalTimePercentage * 100) / 100,
          averageTimePercentage: Math.round(averageTimePercentage * 100) / 100
        }
      });

    } catch (error) {
      console.error('Error fetching game statistics:', error);
      response.status(500).json({
        error: 'Internal server error',
        message: error.message
      });
    }
    return;
  }

  // Only allow POST requests for saving data
  if (request.method !== 'POST') {
    response.status(405).json({ 
      error: 'Method not allowed. Use GET or POST.' 
    });
    return;
  }

  try {
    // Parse request body - handle both string and already parsed JSON
    console.log('Raw request body:', request.body);
    console.log('Request body type:', typeof request.body);
    
    let requestBody;
    if (typeof request.body === 'string') {
      try {
        requestBody = JSON.parse(request.body);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Body content:', request.body);
        response.status(400).json({ 
          error: 'Invalid JSON in request body',
          details: parseError.message,
          receivedBody: request.body
        });
        return;
      }
    } else {
      requestBody = request.body;
    }
    
    console.log('Parsed request body:', requestBody);
    const { totalTime, averageTime, gameType, averageWIP } = requestBody;

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
        error: 'gameType is required and must be a string (multitask, singletask, or wip)' 
      });
      return;
    }

    // Validate game type values
    if (gameType !== 'multitask' && gameType !== 'singletask' && gameType !== 'wip') {
      response.status(400).json({ 
        error: 'gameType must be either "multitask", "singletask", or "wip"' 
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

    // Validate averageWIP if provided
    let averageWIPNum = null;
    if (averageWIP !== undefined && averageWIP !== null) {
      averageWIPNum = Number(averageWIP);
      if (isNaN(averageWIPNum) || averageWIPNum < 0) {
        response.status(400).json({ 
          error: 'averageWIP must be a valid positive number' 
        });
        return;
      }
    }

    // Prepare document data
    const gameRunData = {
      totalTime: totalTimeNum,
      averageTime: averageTimeNum,
      gameType: gameType,
      timestamp: new Date(),
      createdAt: new Date().toISOString()
    };

    // Include averageWIP if provided
    if (averageWIPNum !== null) {
      gameRunData.averageWIP = averageWIPNum;
    }

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
