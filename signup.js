/* 
   Tarbiyah Signup Logic (signup.js)
   ফিচার: নতুন ইউজার তৈরি এবং ডিফল্ট কোর্স লিস্ট (খালি) সেট করা।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const signupForm = document.getElementById('signup-form');

if (signupForm) {
    signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('signup-name').value;
        const email = document.getElementById('signup-email').value;
        const pass = document.getElementById('signup-pass').value;

        if(pass.length < 6) {
            alert("Password must be at least 6 characters long.");
            return;
        }

        try {
            // ১. Authentication এ ইউজার তৈরি
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            const user = userCredential.user;

            // ২. Firestore-এ ইউজারের জন্য ডেডিকেটেড প্রোফাইল তৈরি করা (এটা আপডেট করা হয়েছে।)
            // signup.js এর ভেতর পরিবর্তন করুন
    await setDoc(doc(db, "Users", user.uid), {
    name: name,
    email: email,
    status: "Active",
    role: "student",
    myCourses: [],
    myBooks: [], // কেনা বইয়ের তালিকা
    interests: [], // পছন্দের কিওয়ার্ড
    profilePic: "",
    onboardingCompleted: false, // এটি চেক করেই পপআপ দেখাবো
    createdAt: new Date()
});

            alert("Account created successfully! Please wait for Admin approval.");
            window.location.href = "login.html";
        } catch (error) {
            console.error(error);
            alert("Error creating account: " + error.message);
        }
    });
}