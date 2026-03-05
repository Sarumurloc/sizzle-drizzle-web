// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// ⚠️ 請將這裡替換成你 Firebase 後台提供的真實設定值！
const firebaseConfig = {
  apiKey: "AIzaSyACsOsE467bbOGrHdkxjUhcdPL-i_F_rNM",
  authDomain: "sizzle-drizzle-restaurant.firebaseapp.com",
  projectId: "sizzle-drizzle-restaurant",
  storageBucket: "sizzle-drizzle-restaurant.firebasestorage.app",
  messagingSenderId: "713438474887",
  appId: "1:713438474887:web:f4a1514105ad9beac7be22"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);

// 初始化並導出 Firestore 資料庫實例 (這行最重要，絕對不能漏)
const db = getFirestore(app);
export { db };
