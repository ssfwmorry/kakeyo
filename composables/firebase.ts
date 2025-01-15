import { getApp, getApps, initializeApp } from 'firebase/app';
const config = useRuntimeConfig();

const firebaseConfig = {
  apiKey: config.public.firebaseApiKey,
  authDomain: config.public.firebaseAuthDomain,
  databaseURL: config.public.firebaseDatabaseURL,
  projectId: config.public.firebaseProjectId,
  storageBucket: config.public.firebaseStorageBucket,
  messagingSenderId: config.public.firebaseMessagingSenderId,
  appId: config.public.firebaseAppId,
};

const firebase = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export default firebase;
