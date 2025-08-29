// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-auth.js";
import { 
  getFirestore, collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc, 
  query, where, onSnapshot, orderBy, limit, 
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence, CACHE_SIZE_UNLIMITED 
} from "https://www.gstatic.com/firebasejs/9.6.10/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.6.10/firebase-storage.js";

// Retry logic
const MAX_RETRIES = 3;
let retryCount = 0;

// ✅ Correct Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyC4iO3jHKZG0GCQSMFmdtVz0rvLmcrlW3U",
  authDomain: "my-portfolio-eb16c.firebaseapp.com",
  projectId: "my-portfolio-eb16c",
  storageBucket: "my-portfolio-eb16c.appspot.com", // FIXED
  messagingSenderId: "470842246425",
  appId: "1:470842246425:web:6e7b3b7fadbda5b6d6b188",
  measurementId: "G-WY142SXTZP"
};

// Initialize Firebase with retry logic
let app, auth, db, storage;

function initializeFirebase() {
  try {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);

    // Enable offline persistence
    enableIndexedDbPersistence(db, { cacheSizeBytes: CACHE_SIZE_UNLIMITED })
      .then(() => console.log('Offline persistence enabled'))
      .catch((err) => {
        if (err.code === 'failed-precondition') {
          console.warn('Multiple tabs open, using multi-tab persistence instead');
          return enableMultiTabIndexedDbPersistence(db);
        } else if (err.code === 'unimplemented') {
          console.warn('Offline persistence not supported by this browser');
        } else {
          console.error('Error enabling offline persistence:', err);
        }
      });

    console.log('Firebase initialized successfully');
    retryCount = 0;
    return true;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    if (retryCount < MAX_RETRIES) {
      retryCount++;
      console.log(`Retrying Firebase initialization (${retryCount}/${MAX_RETRIES})...`);
      setTimeout(initializeFirebase, 2000);
    } else {
      console.error('Max retries reached. Could not initialize Firebase.');
    }
    return false;
  }
}

initializeFirebase();

// Test Firestore connection
async function testDatabaseConnection() {
  try {
    if (!db) {
      console.error('Database instance is null');
      return false;
    }
    const testCollection = collection(db, 'projects');
    const testQuery = query(testCollection, limit(1));
    const testSnapshot = await getDocs(testQuery);
    console.log('Firestore test result:', !testSnapshot.empty ? '✅ Success' : '⚠️ No documents found');
    return true;
  } catch (error) {
    console.error('Firestore connection test failed:', error);
    return false;
  }
}

// Export services
export { 
  app, auth, db, storage,
  signInWithEmailAndPassword, signOut, onAuthStateChanged,
  collection, addDoc, getDocs, getDoc, doc, updateDoc, deleteDoc,
  query, where, onSnapshot, orderBy, limit,
  enableIndexedDbPersistence, enableMultiTabIndexedDbPersistence,
  CACHE_SIZE_UNLIMITED, ref, uploadBytes, getDownloadURL
};
