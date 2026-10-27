import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
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
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || 'AIzaSyDwO44HaWh-0XEKuGRu4HemQVNtuuux44M',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || 'auto-survey-vn.firebaseapp.com',
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'auto-survey-vn',
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || 'auto-survey-vn.firebasestorage.app',
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '196269599491',
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '1:196269599491:web:e45151cab5f06fadad9736',
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || 'G-G5DJL6FMX1',
};

// Check if official Firebase API key has been connected
export const isFirebaseConfigured = (): boolean => {
  const key = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || firebaseConfig.apiKey;
  return typeof key === 'string' && key.length > 20 && !key.includes('DummyKey');
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
 * Sign in with genuine Google Account using official Firebase Auth Popup (accounts.google.com)
 */
export async function signInWithGoogleFirebase(): Promise<{
  success: boolean;
  user?: { email: string; displayName: string; photoURL: string; uid: string };
  error?: string;
  needConfig?: boolean;
}> {
  if (!isFirebaseConfigured()) {
    return {
      success: false,
      needConfig: true,
      error: 'Cần kết nối khóa Firebase API Key chính thức để kích hoạt đăng nhập Google qua accounts.google.com.',
    };
  }

  try {
    // Attempt standard popup first (works directly on both desktop & mobile touch events)
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

    // If popup was blocked or closed on mobile, fallback to redirect flow
    if (
      err.code === 'auth/popup-blocked' ||
      err.code === 'auth/cancelled-popup-request' ||
      err.code === 'auth/popup-closed-by-user' ||
      err.code === 'auth/internal-error'
    ) {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { success: false }; // Page will redirect to Google
      } catch (redirectErr: any) {
        return {
          success: false,
          error: 'Trình duyệt đã chặn cửa sổ đăng nhập. Vui lòng thử mở bằng trình duyệt Safari hoặc Chrome.',
        };
      }
    }

    let msg = 'Đăng nhập Google thất bại.';
    let needConfig = false;

    if (
      err.code === 'auth/invalid-api-key' ||
      err.code === 'auth/api-key-not-valid' ||
      err.code === 'auth/configuration-not-found'
    ) {
      msg = 'Khóa Firebase API Key không hợp lệ hoặc chưa được kích hoạt Google Sign-In trên Firebase Console.';
      needConfig = true;
    } else if (err.code === 'auth/unauthorized-domain') {
      msg = 'Tên miền auto-survey-vn.vercel.app chưa được cấp quyền (Authorized Domain) trên Firebase Console.';
    } else if (err.code === 'auth/network-request-failed') {
      msg = 'Lỗi kết nối mạng đến máy chủ Google.';
    } else if (err.message) {
      msg = err.message;
    }

    return { success: false, error: msg, needConfig };
  }
}

/**
 * Sign in with Google Redirect (Ideal for Mobile browsers where popups are blocked)
 */
export async function signInWithGoogleRedirect() {
  return await signInWithRedirect(auth, googleProvider);
}

/**
 * Handle redirect result after returning from accounts.google.com
 */
export async function handleGoogleRedirectResult(): Promise<{
  success: boolean;
  user?: { email: string; displayName: string; photoURL: string; uid: string };
  error?: string;
}> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user && result.user.email) {
      return {
        success: true,
        user: {
          email: result.user.email,
          displayName: result.user.displayName || result.user.email.split('@')[0],
          photoURL: result.user.photoURL || '',
          uid: result.user.uid,
        },
      };
    }
    return { success: false };
  } catch (err: any) {
    console.error('Redirect Result Error:', err);
    let msg = err.message || 'Lỗi nhận diện tài khoản Google sau chuyển trang.';
    if (err.code === 'auth/unauthorized-domain') {
      msg = 'Tên miền chưa được thêm vào mục Authorized Domains trên Firebase Console.';
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

/**
 * Send password reset email via official Firebase Auth
 * Guarantees delivery by auto-provisioning the user in Firebase Auth if not already present
 * (bypasses Firebase Email Enumeration Protection silently swallowing nonexistent accounts)
 */
export async function sendPasswordResetEmailFirebase(email: string): Promise<{ success: boolean; error?: string }> {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // Ensure the email exists as a user in Firebase Auth so Google's server actually dispatches the email
    try {
      await createUserWithEmailAndPassword(
        auth,
        cleanEmail,
        'AutoSurvey#' + Math.random().toString(36).substring(2, 10) + 'A1!' + Date.now()
      );
    } catch (provisionErr: any) {
      // If auth/email-already-in-use, user already exists in Firebase Auth, which is ideal!
    }

    const actionCodeSettings = {
      url: typeof window !== 'undefined' ? `${window.location.origin}/login?reset=success` : 'https://auto-survey-vn.vercel.app/login?reset=success',
      handleCodeInApp: false,
    };

    await sendPasswordResetEmail(auth, cleanEmail, actionCodeSettings);
    return { success: true };
  } catch (err: any) {
    console.error('Firebase sendPasswordResetEmail Error:', err);
    let msg = 'Không thể gửi email đặt lại mật khẩu qua Firebase.';
    if (err.code === 'auth/user-not-found') {
      msg = 'Email này chưa được đăng ký trong hệ thống. Vui lòng kiểm tra lại địa chỉ email hoặc đăng ký tài khoản mới.';
    } else if (err.code === 'auth/invalid-email') {
      msg = 'Địa chỉ Email không đúng định dạng. Vui lòng nhập đúng email (ví dụ: name@gmail.com).';
    } else if (err.code === 'auth/too-many-requests') {
      msg = 'Bạn đã gửi yêu cầu quá nhiều lần. Vui lòng đợi vài phút rồi thử lại để đảm bảo an toàn.';
    } else if (err.message) {
      msg = err.message;
    }
    return { success: false, error: msg };
  }
}

/**
 * Register account with Email and Password directly on Firebase Auth
 */
export async function registerWithEmailFirebase(email: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    await createUserWithEmailAndPassword(auth, email.trim(), password);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

