import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyACsOsE467bbOGrHdkxjUhcdPL-i_F_rNM",
  authDomain: "sizzle-drizzle-restaurant.firebaseapp.com",
  projectId: "sizzle-drizzle-restaurant",
  storageBucket: "sizzle-drizzle-restaurant.firebasestorage.app",
  messagingSenderId: "713438474887",
  appId: "1:713438474887:web:f4a1514105ad9beac7be22"
};

// 嚴謹邏輯：初始化並確保 db 被正確導出
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app); // 關鍵點：必須有 export 字樣
