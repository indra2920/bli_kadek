import { db } from './src/firebase';
import { collection, addDoc } from 'firebase/firestore';

async function testWrite() {
  console.log("Starting test write...");
  try {
    const docRef = await addDoc(collection(db, 'test_connection'), {
      timestamp: Date.now(),
      message: "Test write from script"
    });
    console.log("Success! ID:", docRef.id);
  } catch (err) {
    console.error("Failure:", err);
  }
}

testWrite();
