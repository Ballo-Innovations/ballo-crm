import { type FirebaseApp, getApps, initializeApp } from "firebase/app";
import { type Auth, getAuth } from "firebase/auth";
import { type Firestore, getFirestore } from "firebase/firestore";

import { getClientEnv } from "@/config/env";

/**
 * Browser-side Firebase SDK. Do not import from Server Components, Server
 * Actions, or Route Handlers - use `lib/firebase/admin.ts` there instead.
 */
function createFirebaseClientApp(): FirebaseApp {
  const env = getClientEnv();

  const config = {
    apiKey: env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  return getApps().length > 0 ? getApps()[0]! : initializeApp(config);
}

export const firebaseApp: FirebaseApp = createFirebaseClientApp();
export const firebaseAuth: Auth = getAuth(firebaseApp);
export const firestoreClient: Firestore = getFirestore(firebaseApp);
