import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyALt0K-_nyP7l0GjjzBS7uV37A_05OHHGw",
  authDomain: "unov1-9a052.firebaseapp.com",
  projectId: "unov1-9a052",
  storageBucket: "unov1-9a052.firebasestorage.app",
  messagingSenderId: "1074891055983",
  appId: "1:1074891055983:web:567f1ccda5c4fdb361be9a",
  measurementId: "G-R1XEXJDX2L",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export default app;
