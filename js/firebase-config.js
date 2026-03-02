// 嚴謹邏輯：初始化 Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// 這裡填入你剛才複製的 Firebase 配置
const firebaseConfig = {
  apiKey: "AIzaSyACsOsE467bbOGrHdkxjUhcdPL-i_F_rNM",
  authDomain: "sizzle-drizzle-restaurant.firebaseapp.com",
  projectId: "sizzle-drizzle-restaurant",
  storageBucket: "sizzle-drizzle-restaurant.firebasestorage.app",
  messagingSenderId: "713438474887",
  appId: "1:713438474887:web:f4a1514105ad9beac7be22"
};

// 初始化實例
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// 導出模組供其他檔案使用
export { db, auth };
