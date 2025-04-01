# Salesforce Metadata Manager Mobile App Integration

This document describes how the mobile application integrates with the existing web application for the Salesforce Metadata Management Solution.

## Architecture Overview

The mobile application is built using React Native and Expo, allowing for cross-platform development for both iOS and Android devices. It shares the same backend API endpoints as the web application, providing a consistent experience across all platforms.

## Mobile App Features

The mobile application includes the following key features:

1. **Authentication** - Login and registration functionality
2. **Organization Management** - List, connect, and select Salesforce organizations
3. **Data Model Visualization** - View Salesforce objects, fields, and relationships
4. **Security Analysis** - View and filter security issues by severity and category
5. **SOQL Query Editor** - Execute and view results of SOQL queries
6. **Settings** - Configure application preferences

## Integration Points

### API Integration

The mobile app connects to the same RESTful API endpoints used by the web application. The API client (`mobile/api/client.ts`) provides a standardized interface for making authenticated requests to:

- `/api/login` & `/api/register` - Authentication endpoints
- `/api/orgs/*` - Organization management endpoints
- `/api/orgs/:id/metadata` - Metadata retrieval endpoints
- `/api/orgs/:id/health-score` - Health score and security analysis endpoints
- `/api/orgs/:id/query` - SOQL query execution endpoint

### Authentication Flow

The mobile app uses the same session-based authentication as the web application:

1. User logs in with username and password
2. Server responds with a session cookie
3. Subsequent API requests include the cookie for authentication
4. Session state is maintained across app restarts

## Mobile-Specific Considerations

### Data Caching

The mobile app implements optimistic UI updates and offline caching for better performance and user experience when network connectivity is limited:

- Recently accessed metadata is cached locally
- Data synchronization occurs automatically when the app is brought to the foreground
- Users can manually refresh data with pull-to-refresh gestures

### UI/UX Adaptations

While maintaining feature parity with the web application, the mobile UI is optimized for touch interactions and smaller screens:

- Navigation uses React Navigation's stack and tab-based navigation
- List views are optimized for touch with appropriate spacing
- Detail views use modal screens to conserve space
- Filter controls are adapted for touch interactions

## Development Workflow

### Setup

Both the web and mobile applications share the same repository, with mobile-specific files located in the `/mobile` directory. To start developing the mobile app:

1. Install Expo CLI: `npm install -g expo-cli`
2. Navigate to the mobile directory: `cd mobile`
3. Install dependencies: `npm install`
4. Start the development server: `npm start`

### Building for Production

To create production builds for app stores:

```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

## Future Enhancements

Planned enhancements for the mobile application include:

1. **Push Notifications** - Alerts for security issues and metadata changes
2. **Offline Mode** - Full offline functionality with synchronization
3. **Biometric Authentication** - Face/Touch ID for secure access
4. **Mobile-Specific Features** - Camera integration for scanning Salesforce QR codes