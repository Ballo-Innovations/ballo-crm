import "server-only";

import { type App, cert, getApps, initializeApp } from "firebase-admin/app";
import { type Auth, getAuth } from "firebase-admin/auth";
import { type Firestore, getFirestore } from "firebase-admin/firestore";

import { getServerEnv } from "@/config/env";

/**
 * Server-only Firebase Admin SDK. Use from Server Components, Server Actions,
 * and Route Handlers. The `server-only` import makes any accidental client
 * bundle inclusion fail at build time instead of leaking admin credentials.
 */
function createFirebaseAdminApp(): App {
  if (getApps().length > 0) {
    return getApps()[0]!;
  }

  const env = getServerEnv();

  return initializeApp({
    credential: cert({
      projectId: env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: env.FIREBASE_ADMIN_CLIENT_EMAIL,
      // Vercel env vars escape newlines; restore them before passing to the SDK.
      privateKey: env.FIREBASE_ADMIN_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });
}

const firebaseAdminApp: App = createFirebaseAdminApp();

export const firestoreAdmin: Firestore = getFirestore(firebaseAdminApp);
export const authAdmin: Auth = getAuth(firebaseAdminApp);
