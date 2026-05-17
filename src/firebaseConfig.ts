// web/src/firebaseConfig.ts

import { initializeApp, getApps, getApp, type FirebaseApp } from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier,
  signInWithPopup,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  updateProfile,
  signInWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  sendPasswordResetEmail,
  type Auth,
  type AuthError,
  type UserCredential,
  type AuthProvider,
  type AuthCredential,
  type OAuthCredential,
  type User,
  type ConfirmationResult,
  type ApplicationVerifier
} from "firebase/auth";
import { getAnalytics, isSupported, type Analytics } from "firebase/analytics";
import { getFirestore, type Firestore } from "firebase/firestore"; // Only keep getFirestore and Firestore type

// Firebase configuration interface
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId: string;
}

// Firebase config from environment (no hardcoded secrets). Set in .env.local:
// NEXT_PUBLIC_FIREBASE_API_KEY, NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN, etc.
const firebaseConfig: FirebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY ?? "",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ?? "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID ?? "",
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID ?? ""
};

// Only skip Firebase init during build/SSR (no window). In the browser init with try-catch so missing API key doesn't crash the app.
const isBrowser = typeof window !== "undefined";

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let isFirebaseAvailable = false;

if (isBrowser) {
  try {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey.length === 0) {
      throw new Error("Firebase API key not set (add NEXT_PUBLIC_FIREBASE_API_KEY in Vercel env)");
    }
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    db = getFirestore(app);
    isFirebaseAvailable = true;
  } catch (e) {
    console.warn("[Firebase] Not configured or invalid API key. Auth features disabled.", e instanceof Error ? e.message : e);
    // Fallback so the app still loads (e.g. on www.sainto.app when env vars are missing)
    app = {} as FirebaseApp;
    auth = createNoOpAuth();
    db = {} as Firestore;
  }
} else {
  app = {} as FirebaseApp;
  auth = {} as Auth;
  db = {} as Firestore;
}

/** No-op Auth when Firebase init fails: onAuthStateChanged immediately calls callback(null) so app doesn't crash. */
function createNoOpAuth(): Auth {
  return {
    currentUser: null,
    onAuthStateChanged: (nextOrObserver: ((u: unknown) => void) | { next: (u: unknown) => void }, _error?: (e: unknown) => void, _completed?: () => void) => {
      const next = typeof nextOrObserver === "function" ? nextOrObserver : nextOrObserver.next;
      if (next) next(null);
      return () => {};
    },
  } as Auth;
}

// Initialize Firebase Analytics only when Firebase is available (avoid getProvider when init failed)
let analytics: Analytics | undefined;
if (isBrowser && isFirebaseAvailable && getApps().length > 0) {
  isSupported().then((supported: boolean) => {
    if (supported) {
      analytics = getAnalytics(getApp());
      console.log("Firebase Analytics initialized.");
    } else {
      console.log("Firebase Analytics not supported in this environment.");
    }
  }).catch((error: Error) => {
    console.error("Error checking analytics support:", error);
  });
}

// Export Firebase instances
export {
  app,
  auth,
  db,
  analytics,
  firebaseConfig,
  isFirebaseAvailable
};

// Export Firebase provider classes
export {
  GoogleAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  RecaptchaVerifier
};

// Export Firebase auth methods
export {
  signInWithPopup,
  signInWithPhoneNumber,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  fetchSignInMethodsForEmail,
  linkWithCredential,
  sendPasswordResetEmail
};

// Export Firebase types for use in other components
export type {
  AuthError,
  UserCredential,
  AuthProvider,
  AuthCredential,
  OAuthCredential,
  User,
  ConfirmationResult,
  ApplicationVerifier,
  Auth,
  FirebaseApp,
  Analytics,
  Firestore
};