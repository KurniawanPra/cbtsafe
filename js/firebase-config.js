// ============================================================
// FIREBASE CONFIGURATION (Compat v8)
// ============================================================
// Menggunakan firebase compat version sesuai script di header HTML HTML kita
// Tidak menggunakan 'import' karena bukan module ESM / webpack bundler

const firebaseConfig = {
  apiKey: "AIzaSyCNOnQhf26aWk8l5PBej-R3soJXlMS9Wzs",
  authDomain: "cbtsafe.firebaseapp.com",
  projectId: "cbtsafe",
  storageBucket: "cbtsafe.firebasestorage.app",
  messagingSenderId: "751761542056",
  appId: "1:751761542056:web:bb6c89ae345a97f2d16b9d"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);

// Inisialisasi services
const db = firebase.firestore();
const auth = firebase.auth();

console.log("Firebase initialized.");
