// Firebase 모듈 import (Firestore 포함)
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js";

// ✅ 너가 콘솔에서 받은 firebaseConfig 그대로
const firebaseConfig = {
  apiKey: "AIzaSyBpeQgsKUE6PJ_d5E5kmzMYMyNR4fFdsjs",
  authDomain: "game-df2be.firebaseapp.com",
  projectId: "game-df2be",
  storageBucket: "game-df2be.firebasestorage.app",
  messagingSenderId: "624217836274",
  appId: "1:624217836274:web:cdf945d27dff44821f1e6b",
  measurementId: "G-86L2CM11S1" // 있어도 되고 없어도 됨
};

// Firebase 초기화
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ---------- 게임 UI ----------
const box = document.getElementById("box");
const startBtn = document.getElementById("startBtn");
const info = document.getElementById("info");
const bestEl = document.getElementById("best");

// ---------- 상태 ----------
let state = "idle"; // idle | waiting | go
let timerId = null;
let startTime = 0;

// 로컬 베스트 기록(화면용)
const BEST_KEY = "reaction_best_ms";
const loadBest = () => Number(localStorage.getItem(BEST_KEY) || 0);
const saveBestLocal = (ms) => localStorage.setItem(BEST_KEY, String(ms));

function renderBest(){
  const best = loadBest();
  bestEl.textContent = best ? `🏆 최고기록: ${best} ms` : "🏆 최고기록 없음";
}

// Firestore 저장
async function saveScoreDB(ms){
  try{
    await addDoc(collection(db, "reaction_scores"), {
      ms,
      created_at: serverTimestamp()
    });
    console.log("DB 저장 완료:", ms);
  }catch(e){
    console.error("DB 저장 실패:", e);
  }
}

function setBox(bg, text){
  box.style.background = bg;
  box.textContent = text;
}

// 시작
function start(){
  state = "waiting";
  startBtn.disabled = true;
  info.textContent = "초록색으로 바뀌면 즉시 클릭!";
  setBox("#ef4444", "대기중...\n지금 누르면 실패!");

  const delay = 1000 + Math.random() * 3000; // 1~4초 랜덤
  timerId = setTimeout(()=>{
    state = "go";
    startTime = performance.now();
    setBox("#22c55e", "지금 클릭!");
  }, delay);
}

box.addEventListener("click", ()=>{
  // 너무 빨리 누름
  if(state === "waiting"){
    clearTimeout(timerId);
    timerId = null;
    state = "idle";
    info.textContent = "❌ 너무 빨라요! 다시 시도하세요.";
    setBox("#f59e0b", "성급함 😅\n(다시 시작)");
    startBtn.disabled = false;
    return;
  }

  // 성공 측정
  if(state === "go"){
    const ms = Math.round(performance.now() - startTime);
    info.textContent = `✅ 반응속도: ${ms} ms`;

    // 로컬 최고기록 갱신
    const best = loadBest();
    if(!best || ms < best){
      saveBestLocal(ms);
      info.textContent += " (신기록!) 🎉";
    }
    renderBest();

    // ✅ Firestore 저장
    saveScoreDB(ms);

    state = "idle";
    startBtn.disabled = false;
    setBox("#0ea5e9", "다시 하려면 시작!");
  }
});

startBtn.addEventListener("click", start);

// 초기 표시
renderBest();
