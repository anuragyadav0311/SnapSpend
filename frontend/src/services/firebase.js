import { getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

function hasFirebaseConfig() {
  return Boolean(firebaseConfig.apiKey && firebaseConfig.authDomain && firebaseConfig.projectId && firebaseConfig.appId);
}

let firebaseAuth = null;

function getFirebaseAuth() {
  if (!hasFirebaseConfig()) {
    throw new Error("Firebase is not configured. Add the VITE_FIREBASE_* values to the frontend environment.");
  }

  if (!firebaseAuth) {
    const app = getApps()[0] || initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
  }

  return firebaseAuth;
}

export async function getGoogleFirebaseIdToken() {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  try {
    const result = await signInWithPopup(getFirebaseAuth(), provider);
    return result.user.getIdToken();
  } catch (error) {
    if (error?.code === "auth/popup-closed-by-user" || error?.code === "auth/cancelled-popup-request") {
      throw new Error("Google sign-in was cancelled.");
    }
    if (error?.code === "auth/configuration-not-found") {
      throw new Error("Firebase Authentication is not enabled for this project. Enable Authentication and the Google provider in Firebase Console.");
    }
    if (error?.code === "auth/operation-not-allowed") {
      throw new Error("Google sign-in is not enabled in Firebase Authentication.");
    }
    throw error;
  }
}
