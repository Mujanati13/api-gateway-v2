# Firebase Setup Instructions

## 1. Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or "Add project"
3. Enter your project name (e.g., "api-gateway-tracker")
4. Choose whether to enable Google Analytics (optional)
5. Create the project

## 2. Set up Firestore Database

1. In your Firebase project console, click on "Firestore Database"
2. Click "Create database"
3. Choose "Start in test mode" for now (you can secure it later)
4. Select a location for your database
5. Click "Done"

## 3. Get your Firebase Configuration

1. In your Firebase project console, click on the gear icon (Project Settings)
2. Scroll down to "Your apps" section
3. Click on the web icon (`</>`) to add a web app
4. Register your app with a nickname (e.g., "API Gateway Web")
5. You'll see a configuration object like this:

```javascript
const firebaseConfig = {
  apiKey: "your-api-key-here",
  authDomain: "your-project-id.firebaseapp.com",
  projectId: "your-project-id",
  storageBucket: "your-project-id.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abcdef123456789"
};
```

## 4. Update your Firebase Configuration

1. Open `src/config/firebase.js`
2. Replace the placeholder values with your actual Firebase configuration:

```javascript
// Replace this configuration with your actual Firebase config
const firebaseConfig = {
  apiKey: "your-actual-api-key",
  authDomain: "your-actual-project.firebaseapp.com",
  projectId: "your-actual-project-id",
  storageBucket: "your-actual-project.appspot.com",
  messagingSenderId: "your-actual-sender-id",
  appId: "your-actual-app-id"
};
```

## 5. Firestore Security Rules (Optional but Recommended)

For production, update your Firestore security rules:

1. Go to Firestore Database > Rules
2. Update the rules to allow read/write for authenticated users or specific conditions:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /api_traces/{document} {
      allow read, write: if true; // For testing - restrict this in production
    }
  }
}
```

## 6. Features Enabled

Once configured, your application will automatically:

- ✅ Track all HTTP requests and responses
- ✅ Log request timing and status codes
- ✅ Store trace data in Firestore
- ✅ Display analytics and trace history
- ✅ Export trace data
- ✅ Filter and search traces
- ✅ Real-time trace monitoring

## 7. Viewing Traces

1. Start your application: `npm run dev`
2. Navigate to the "Request Tracker" tab
3. Make some API requests using the gateway
4. View real-time traces and analytics

## 8. Data Structure

Traces are stored in Firestore with this structure:

```javascript
{
  id: "unique-trace-id",
  sessionId: "session-identifier",
  requestId: "request-identifier", 
  type: "REQUEST_START" | "REQUEST_COMPLETE" | "USER_TRACE",
  timestamp: Firestore.Timestamp,
  method: "GET" | "POST" | "PUT" | "DELETE",
  url: "request-url",
  status: "SUCCESS" | "ERROR" | "PENDING",
  responseTime: 1234, // milliseconds
  headers: {...},
  body: {...},
  environment: "local" | "staging" | "production",
  userAgent: "browser-info",
  createdAt: "iso-date-string"
}
```

## Troubleshooting

- **Connection Issues**: Check your internet connection and Firebase configuration
- **Permission Errors**: Verify Firestore security rules allow read/write access
- **Missing Traces**: Ensure the HTTP interceptor is imported in your app
- **Large Payloads**: The system automatically truncates large request/response bodies

## Security Considerations

- The system automatically redacts sensitive data (passwords, tokens, etc.)
- Consider implementing authentication for production use
- Review and restrict Firestore security rules
- Monitor your Firebase usage and billing
