# Salesforce Metadata Manager Mobile App

This is the mobile application for the Salesforce Metadata Management Solution. It provides iOS and Android clients to access the same functionality as the web application.

## Features

- Access Salesforce organization data on the go
- View data model information
- Check security issues and health scores
- Execute SOQL queries
- Configure application settings

## Setup Instructions

### Prerequisites

- Node.js (v16+)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (for iOS development) or Xcode
- Android Studio & Android Emulator (for Android development)

### Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on a device or emulator:
   - Press `i` to open in iOS Simulator
   - Press `a` to open in Android Emulator
   - Scan the QR code with the Expo Go app on your physical device

## Integration with Backend

The mobile app connects to the same backend API as the web application. The API base URL is configured in the `api.ts` file and can be modified to point to your deployed backend.

## Building for Production

To create production builds for app stores:

```bash
# For iOS
expo build:ios

# For Android
expo build:android
```

## Technologies Used

- React Native
- Expo
- React Navigation
- TypeScript