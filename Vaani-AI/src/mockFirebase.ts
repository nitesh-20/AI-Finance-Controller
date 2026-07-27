// Mock Firebase implementations to completely bypass Firebase cleanly
export const initializeApp = () => ({});
export const getAuth = () => ({});
export const getFirestore = () => ({});

export const collection = () => ({});
export const query = () => ({});
export const where = () => ({});
export const orderBy = () => ({});
export const limit = () => ({});
export const onSnapshot = () => (() => {});
export const addDoc = async () => ({ id: 'dummy' });
export const updateDoc = async () => {};
export const setDoc = async () => {};
export const getDocs = async () => ({ empty: true, docs: [] });
export const getDoc = async () => ({ exists: () => false, data: () => ({}) });
export const getDocFromServer = async () => ({ exists: () => false, data: () => ({}) });
export const writeBatch = () => ({ commit: async () => {}, set: () => {} });
export const doc = () => ({ id: 'dummy' });
export const serverTimestamp = () => new Date();
export const arrayUnion = (...args: any[]) => args;

export const signInWithPhoneNumber = async () => ({});
export const RecaptchaVerifier = class { constructor() {} render() {} clear() {} verify() {} };
export const onAuthStateChanged = () => (() => {});
export const signOut = async () => {};
export const db = {};
export const auth = {};

export const GoogleAuthProvider = class { constructor() {} };
export const signInWithPopup = async () => ({ user: { uid: 'dummy-user', email: 'test@example.com' } });
export const Timestamp = { now: () => ({ toDate: () => new Date() }) };
export class User {
  uid = 'dummy';
  email = 'dummy';
  displayName = 'dummy';
}
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
 
