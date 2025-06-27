# API Gateway with Firebase Request Tracing

This application provides a comprehensive API gateway with real-time request/response tracing using Firebase Firestore.

## 🚀 Features

### Request Tracing
- ✅ **Automatic HTTP Intercepting**: All axios requests are automatically traced
- ✅ **Real-time Logging**: Traces are logged to Firebase Firestore in real-time
- ✅ **Request/Response Details**: Complete request and response data including headers, body, timing
- ✅ **Error Tracking**: Detailed error logging with stack traces
- ✅ **Session Management**: Traces are grouped by user sessions

### Analytics Dashboard
- 📊 **Request Analytics**: Success rates, response times, error counts
- 📈 **Real-time Monitoring**: Live trace updates every 30 seconds
- 🔍 **Advanced Filtering**: Filter by status, method, type, date range
- 📤 **Data Export**: Export traces as JSON for analysis
- ⏱️ **Timeline View**: Chronological trace timeline

### Security & Privacy
- 🔒 **Data Sanitization**: Automatically redacts sensitive information (passwords, tokens, etc.)
- 🛡️ **Size Limits**: Truncates large payloads to prevent storage bloat
- 👤 **Session Isolation**: Each user session has isolated traces

## 🛠️ Setup

### Prerequisites
- Node.js 16+ 
- Firebase Project with Firestore enabled
- Valid Firebase configuration

### Installation

1. **Clone and Install Dependencies**
   ```bash
   git clone <repository-url>
   cd API-Gateway
   npm install
   ```

2. **Firebase Configuration**
   
   Follow the instructions in `FIREBASE_SETUP.md` to:
   - Create a Firebase project
   - Enable Firestore
   - Get your configuration object
   - Update `src/config/firebase.js`

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Access the Application**
   - API Gateway: http://localhost:5100 (Tab 1)
   - Request Tracker: http://localhost:5100 (Tab 2)

## 📁 Project Structure

```
src/
├── config/
│   └── firebase.js                 # Firebase configuration
├── services/
│   ├── FirebaseTraceService.js     # Core tracing service
│   └── HTTPInterceptor.js          # Axios request interceptor
├── components/
│   ├── RequestTracker.jsx          # Main tracing dashboard
│   └── TracingStatus.jsx           # Status indicator
├── pages/
│   └── Home.jsx                    # API Gateway interface
└── App.jsx                         # Main application
```

## 🔧 Usage

### API Gateway
1. Navigate to the "API Gateway" tab
2. Enter a token or use test environment
3. Submit requests - they'll be automatically traced
4. View real-time trace updates in the local UI

### Request Tracker
1. Navigate to the "Request Tracker" tab
2. View analytics dashboard with:
   - Total requests
   - Success/failure rates
   - Average response times
   - Request distribution charts
3. Browse detailed trace table with:
   - Request/response headers and bodies
   - Timing information
   - Error details
4. Use filters to narrow down traces
5. Export data for external analysis

### Tracing Status
- Look for the status indicator in the bottom-right corner
- Green "Tracing Active": Firebase connected and logging
- Red "Tracing Error": Connection issues (check Firebase config)
- Yellow "Connecting": Establishing Firebase connection

## 📊 Trace Data Structure

Each trace record includes:

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
  responseSize: 5678, // bytes
  headers: {...}, // sanitized headers
  body: {...}, // sanitized request/response body
  environment: "local" | "staging" | "production",
  userAgent: "browser-info",
  createdAt: "iso-date-string",
  error: {...} // error details if applicable
}
```

## 🔍 Monitoring & Debugging

### Check Firebase Connection
```javascript
// The TracingStatus component automatically tests connection
// You can also manually check in browser console:
import { traceService } from './src/services/FirebaseTraceService';
await traceService.logEvent('TEST', { message: 'Test trace' });
```

### View Raw Firestore Data
1. Go to Firebase Console > Firestore Database
2. Navigate to the `api_traces` collection
3. View individual trace documents

### Debug HTTP Interceptor
```javascript
// Check if interceptor is working:
console.log(axios.interceptors.request.handlers); // Should show handlers
console.log(axios.interceptors.response.handlers); // Should show handlers
```

## ⚡ Performance Considerations

- **Automatic Cleanup**: Consider implementing cleanup for old traces
- **Batch Operations**: Large volumes might benefit from batched writes
- **Indexing**: Add Firestore indexes for frequently queried fields
- **Data Limits**: Current limit is 50KB per response body (auto-truncated)

## 🔐 Security Best Practices

1. **Firestore Security Rules**: Implement proper read/write restrictions
2. **API Keys**: Store Firebase config in environment variables for production
3. **Data Retention**: Implement automatic cleanup of old traces
4. **Sensitive Data**: The system auto-redacts common sensitive patterns

## 🚨 Troubleshooting

### Common Issues

**"Tracing Error" Status**
- Check Firebase configuration in `src/config/firebase.js`
- Verify Firestore is enabled in Firebase Console
- Check browser console for detailed error messages

**Missing Traces**
- Ensure HTTP interceptor is imported: `import './services/HTTPInterceptor'`
- Check that requests are made using axios
- Verify Firebase connection status

**Performance Issues**
- Large request/response bodies are auto-truncated
- Consider implementing trace cleanup for old data
- Check Firebase usage quotas

**Empty Analytics**
- Make some API requests first to generate trace data
- Check the session ID matches between requests
- Verify Firestore data is being written

### Debug Mode

Enable debug logging:
```javascript
// In browser console:
localStorage.setItem('debug', 'firebase,tracing');
// Reload page to see debug logs
```

## 📈 Future Enhancements

- [ ] Real-time trace streaming with WebSockets
- [ ] Advanced analytics with charts and graphs
- [ ] Request/Response diff comparison
- [ ] Automated performance alerts
- [ ] Integration with external monitoring tools
- [ ] Trace correlation across microservices
- [ ] Custom trace annotations and tags

## 📝 License

This project is provided as-is for educational and development purposes.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript and enable type-aware lint rules. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
