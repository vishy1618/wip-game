# Pizza Game Cloud Function

This Contentstack Launch Cloud Function captures game completion data and stores it in Firestore.

## Setup

### Environment Variables

The following environment variables must be set in your Contentstack Launch environment Settings page:

```
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_CLIENT_X509_CERT_URL=your-cert-url
```

### Deployment

1. Create a new Cloud Function in Contentstack Launch
2. Upload the `game-results.js` file
3. Set the environment variables
4. Deploy the function

Note: The `firebase-admin` dependency is included in the main project's package.json

## API Endpoint

### POST /game-results

Saves game completion data to Firestore.

#### Request Body

```json
{
  "totalTime": 180.5,
  "averageTime": 30.2,
  "gameType": "multitask"
}
```

#### Parameters

- `totalTime` (number, required): Total game duration in seconds
- `averageTime` (number, required): Average time per order in seconds  
- `gameType` (string, required): Either "multitask" or "singletask"

#### Response

**Success (200)**
```json
{
  "success": true,
  "documentId": "auto-generated-id",
  "message": "Game run data saved successfully",
  "data": {
    "totalTime": 180.5,
    "averageTime": 30.2,
    "gameType": "multitask",
    "timestamp": "2025-06-30T...",
    "createdAt": "2025-06-30T...",
    "documentId": "auto-generated-id"
  }
}
```

**Error (400)**
```json
{
  "error": "totalTime is required and must be a number (in seconds)"
}
```

**Error (500)**
```json
{
  "error": "Internal server error",
  "message": "Detailed error message"
}
```

## Firestore Collection Structure

Data is stored in the `gameruns` collection with auto-generated document IDs:

```
gameruns/
  ├── {auto-id-1}/
  │   ├── totalTime: 180.5
  │   ├── averageTime: 30.2
  │   ├── gameType: "multitask"
  │   ├── timestamp: Firestore Timestamp
  │   └── createdAt: ISO String
  └── {auto-id-2}/
      ├── totalTime: 95.3
      ├── averageTime: 19.1
      ├── gameType: "singletask"
      ├── timestamp: Firestore Timestamp
      └── createdAt: ISO String
```

## Usage in React App

```javascript
const saveGameResults = async (totalTime, averageTime, gameType) => {
  try {
    const response = await fetch('/game-results', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        totalTime,
        averageTime,
        gameType
      })
    });

    const result = await response.json();
    
    if (result.success) {
      console.log('Game results saved:', result.documentId);
    } else {
      console.error('Error saving results:', result.error);
    }
  } catch (error) {
    console.error('Network error:', error);
  }
};
```
