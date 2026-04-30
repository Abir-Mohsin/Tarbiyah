/* 
   Tarbiyah Login Logic (login.js)
   ফিচার: অথেনটিকেশন এবং অ্যাডমিন অ্যাপ্রুভাল চেক।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyByrLkl4953IvCNyVD7jXWUAvj-9AWfD10", 
    authDomain: "tarbiyah-a27d3.firebaseapp.com",
    projectId: "tarbiyah-a27d3",
    storageBucket: "tarbiyah-a27d3.firebasestorage.app",
    messagingSenderId: "1072439212695",
    appId: "1:1072439212695:web:acdfa80a7a6b88f14c87d2",
    measurementId: "G-S832D4HJQL"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginForm = document.getElementById('login-form');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        const submitBtn = loginForm.querySelector('button');

        submitBtn.innerText = "Checking...";
        submitBtn.disabled = true;

        try {
            // ১. ফায়ারবেস অথেনটিকেশন চেক
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // ২. ফায়ারস্টোর থেকে ইউজারের এক্সেস স্ট্যাটাস চেক
            const userRef = doc(db, "Users", user.uid);
            const userSnap = await getDoc(userRef);

            if (userSnap.exists()) {
                const userData = userSnap.data();
                if (userData.status === "Approved") {
                    alert("Welcome back, " + userData.name + "!");
                    window.location.href = "dashboard.html";
                } else {
                    alert("Your account is still PENDING. Please contact Admin after payment.");
                    await auth.signOut(); // অ্যাপ্রুভ না থাকলে লগআউট করে দিবে
                }
            } else {
                alert("User record not found in database.");
                await auth.signOut();
            }
        } catch (error) {
            console.error(error);
            alert("Login Failed: Incorrect email or password.");
        } finally {
            submitBtn.innerText = "Login";
            submitBtn.disabled = false;
        }
    });
}