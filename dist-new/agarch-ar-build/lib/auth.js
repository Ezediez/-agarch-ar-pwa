// 🔥 Firebase Auth Helpers
import { auth } from './firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';

export async function login(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    console.log('✅ LOGIN SUCCESS:', cred.user.uid);
    return cred.user;
  } catch (err) {
    console.error('🚨 FIREBASE LOGIN ERROR:', err?.code, err?.message);
    throw err;
  }
}

export async function signup(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    console.log('✅ SIGNUP SUCCESS:', cred.user.uid);
    return cred.user;
  } catch (err) {
    console.error('🚨 FIREBASE SIGNUP ERROR:', err?.code, err?.message);
    throw err;
  }
}
