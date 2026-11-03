// 1. Amboarina ny fanafarana (Imports) mampiasa ny CDN ofisialy sy feno tsara
import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-analytics.js";
// KOADY NAREKIDITRA: Nafindra amin'ny rakitra firebase-auth.js sy firebase-firestore.js ny imports tsirairay
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged } from "https://gstatic.com";
import { getFirestore, collection, addDoc, query, orderBy, onSnapshot, serverTimestamp } from "https://gstatic.com";

// 🔐 LISITRY NY OLONA SY NY TENY MIAFINA MAHAZO MIDITRA
const allowedUsers = [
  { email: "princi", password: "123" },
  { email: "olona2@gmail.com", password: "mdpOlona2" },
  { email: "fidirana@test.com", password: "testPassword" }
];

// Ny config avy ao amin'ny Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDG4B-2cj2wknKR2VUwsmlwdbxCNzEcwl0",
  authDomain: "chat-674af.firebaseapp.com", // KOADY NAREKIDITRA: Natao feno tsara ny URL eto
  projectId: "chat-674af",
  storageBucket: "chat-674af.firebasestorage.app",
  messagingSenderId: "333842681828",
  appId: "1:333842681828:web:0d6b4f8c025c3984f3c1f1",
  measurementId: "G-6VZ0QTKZ17"
};

// Hanomboka ny Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

let currentUser = null;

// Fanaraha-maso ny toetran'ny fidirana (Authentication State)
onAuthStateChanged(auth, (user) => {
  const authArea = document.getElementById('authArea');
  const chatArea = document.getElementById('chatArea');
  const isAllowed = allowedUsers.some(u => u.email === user?.email);

  if (user && isAllowed) {
    currentUser = user;
    document.getElementById('userDisplay').innerText = user.email;
    authArea.classList.add('hidden');
    if (chatArea) chatArea.classList.remove('hidden');
    loadMessages();
  } else {
    if (user) signOut(auth);
    currentUser = null;
    if (authArea) authArea.classList.remove('hidden');
    if (chatArea) chatArea.classList.add('hidden');
  }
});

// 2. ATAO AO ANATIN'NY WINDOW NY FUNCTION MBA HO HITAN'NY HTML
window.handleLogin = function() {
  const emailInput = document.getElementById('email').value.trim();
  const passwordInput = document.getElementById('password').value;
  
  const validUser = allowedUsers.find(u => u.email === emailInput && u.password === passwordInput);
  
  if (!validUser) {
    alert("Hadisoana: Tsy mety ny mailaka na ny teny miafina, na tsy nahazo alalana ianao!");
    return;
  }

  signInWithEmailAndPassword(auth, emailInput, passwordInput)
    .catch(error => {
      // Raha mbola tsy niforona tao amin'ny Firebase ny kaonty nefa ao anaty lisitra JS, dia amboarina ho azy
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        createUserWithEmailAndPassword(auth, emailInput, passwordInput)
          .catch(err => alert("Hadisoana avy amin'ny Firebase: " + err.message));
      } else {
        alert("Hadisoana: " + error.message);
      }
    });
}

// Hivoaka ny kaonty
window.handleLogout = function() {
  signOut(auth);
}

// Handefa hafatra ho any amin'ny Database
window.sendMsg = async function() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  
  if (text === '' || !currentUser) return;

  try {
    await addDoc(collection(db, "messages"), {
      text: text,
      sender: currentUser.email,
      uid: currentUser.uid,
      createdAt: serverTimestamp()
    });
    input.value = '';
  } catch (e) {
    console.error("Error adding document: ", e);
  }
}

// Haka ny hafatra "Real-time" avy any amin'ny Database
function loadMessages() {
  const chatMessages = document.getElementById('chatMessages');
  if (!chatMessages) return; // Miaro raha tsy mbola misy ny element ao amin'ny HTML

  const q = query(collection(db, "messages"), orderBy("createdAt", "asc"));
  
  onSnapshot(q, (snapshot) => {
    chatMessages.innerHTML = '';
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (!data.text) return; 

      const newMsg = document.createElement('div');
      newMsg.classList.add('message');
      
      if (data.uid === currentUser.uid) {
        newMsg.classList.add('sent');
        newMsg.innerHTML = data.text;
      } else {
        newMsg.classList.add('received');
        newMsg.innerHTML = `<span class="sender-name">${data.sender}</span>${data.text}`;
      }
      chatMessages.appendChild(newMsg);
    });
    chatMessages.scrollTop = chatMessages.scrollHeight;
  });
}
