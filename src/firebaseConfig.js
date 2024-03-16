import { initializeApp } from "firebase/app";
import { getStorage } from "firebase/storage"; 
import { getFirestore } from "firebase/firestore";


const firebaseConfig = {
  apiKey: "AIzaSyB66GePCNeoG_OUS_C0WOtksJbi50KpVuE",
  authDomain: "comprayventasautomovil.firebaseapp.com",
  projectId: "comprayventasautomovil",
  storageBucket: "comprayventasautomovil.appspot.com",
  messagingSenderId: "354354055252",
  appId: "1:354354055252:web:b7047aa753b0cb417e45c1"
};


const app = initializeApp(firebaseConfig);
const db = getFirestore(app); 
const storage = getStorage(app); 

export { db, storage }; 
