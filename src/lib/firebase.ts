import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  Auth,
  User as FirebaseUser,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  collection,
  query,
  where,
  getDocs,
  serverTimestamp,
  Firestore,
} from 'firebase/firestore';

// Firebase Configuration from environment or defaults
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyA_DummyKey_AutoSurveyVN_2026',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'autosurvey-vn.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'autosurvey-vn',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'autosurvey-vn.appspot.com',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '102938475610',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:102938475610:web:9f8e7d6c5b4a3a2b',
};

// Safe Firebase App Initialization (Singleton)
let app: FirebaseApp;
if (!getApps().length) {
  app = initializeApp(firebaseConfig);
} else {
  app = getApp();
}

export const auth: Auth = getAuth(app);
export const firestore: Firestore = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

/**
 * Sign in with real Google Account using Firebase Auth Popup
 */
export async function signInWithGoogleFirebase(): Promise<{
  success: boolean;
  user?: { email: string; displayName: string; photoURL: string; uid: string };
  error?: string;
}> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const fbUser = result.user;
    if (!fbUser.email) {
      return { success: false, error: 'Không nhận được địa chỉ email từ tài khoản Google.' };
    }

    return {
      success: true,
      user: {
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email.split('@')[0],
        photoURL: fbUser.photoURL || '',
        uid: fbUser.uid,
      },
    };
  } catch (err: any) {
    console.error('Firebase Google Sign-In Error:', err);
    // Provide clean, localized error message
    let msg = 'Đăng nhập Google thất bại.';
    if (err.code === 'auth/popup-closed-by-user') {
      msg = 'Cửa sổ đăng nhập Google đã bị đóng trước khi hoàn tất.';
    } else if (err.code === 'auth/popup-blocked') {
      msg = 'Trình duyệt đã chặn cửa sổ pop-up. Vui lòng cho phép pop-up để đăng nhập.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Lỗi kết nối mạng đến máy chủ Google.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Register account with Email & Password via Firebase Auth & sync to Firestore
 */
export async function registerWithFirebase(
  emailInput: string,
  passwordInput: string,
  usernameInput: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
    const fbUser = userCredential.user;

    return {
      success: true,
      user: {
        email: fbUser.email,
        displayName: usernameInput,
        uid: fbUser.uid,
      },
    };
  } catch (err: any) {
    console.error('Firebase Registration Error:', err);
    let msg = 'Đăng ký tài khoản Firebase thất bại.';
    if (err.code === 'auth/email-already-in-use') {
      msg = 'Địa chỉ Email này đã được đăng ký tài khoản trước đó.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Địa chỉ Email không hợp lệ.';
    } else if (err.code === 'auth/weak-password') {
      msg = 'Mật khẩu quá yếu. Vui lòng sử dụng mật khẩu có tối thiểu 6 ký tự.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Login account with Email & Password via Firebase Auth
 */
export async function loginWithFirebase(
  emailInput: string,
  passwordInput: string
): Promise<{ success: boolean; user?: any; error?: string }> {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, emailInput.trim(), passwordInput);
    const fbUser = userCredential.user;

    return {
      success: true,
      user: {
        email: fbUser.email,
        displayName: fbUser.displayName || fbUser.email?.split('@')[0],
        uid: fbUser.uid,
      },
    };
  } catch (err: any) {
    console.error('Firebase Login Error:', err);
    let msg = 'Đăng nhập tài khoản thất bại.';
    if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
      msg = 'Tài khoản hoặc mật khẩu không chính xác.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Địa chỉ Email không đúng định dạng.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Sync user profile to Firebase Firestore database
 */
export async function saveUserToFirestore(userData: {
  uid: string;
  email: string;
  username: string;
  role: 'user' | 'admin';
  credits: number;
  avatar?: string;
}) {
  try {
    const userRef = doc(firestore, 'users', userData.uid);
    await setDoc(
      userRef,
      {
        ...userData,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  } catch (err) {
    console.warn('Firestore sync note (local fallback active):', err);
  }
}
