import { initializeApp } from 'firebase/app';
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
} from 'firebase/auth';

const data = {};

const firebaseConfig = {
  apiKey: 'AIzaSyC35IT1qUpYss-aSS-aOHmfYqGE_y4wA8M',
  authDomain: 'game-store-375507.firebaseapp.com',
  projectId: 'game-store-375507',
  storageBucket: 'game-store-375507.firebasestorage.app',
  messagingSenderId: '932979647014',
  appId: '1:932979647014:web:0dd0cea1873843c76c3ce7',
};

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

async function login(email, password) {
  try {
    const userCredential = await signInWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log('User logged in:', userCredential.user);
    data.user = userCredential.user;
  } catch (error) {
    console.error('Login failed:', error.message);
  }
}

async function register(email, password) {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );
    console.log('User registered:', userCredential.user);
  } catch (error) {
    console.error('Registration failed:', error.message);
  }
}

async function logout() {
  try {
    await signOut(auth);
    console.log('User logged out');
  } catch (error) {
    console.error('Logout failed:', error.message);
  }
}

function getUser() {
  return data.user;
}

export { login, register, logout, getUser };
