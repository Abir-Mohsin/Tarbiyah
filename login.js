/* 
   Tarbiyah Login Master Script
   Features: Email Login, Phone OTP, and Role Selection.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ১. ফায়ারবেস কনফিগারেশন
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

// ২. ইমেইল ও পাসওয়ার্ড লগইন
const loginForm = document.getElementById('login-form');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, pass);
            await checkUserRole(userCredential.user);
        } catch (error) {
            alert("Login Failed: Incorrect email or password.");
        }
    });
}

// ৩. ফোন লগইন সেটাআপ (Recaptcha)
if(document.getElementById('recaptcha-container')) {
    window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', { 'size': 'invisible' });
}

// ওটিপি পাঠানো
document.getElementById('send-otp-btn')?.addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value;
    if(!phoneNumber) return alert("Please enter phone number!");
    
    const appVerifier = window.recaptchaVerifier;
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.getElementById('otp-input-area').classList.remove('hidden');
            alert("OTP Sent!");
        }).catch((error) => { alert("Error: " + error.message); });
});

// ওটিপি ভেরিফাই
document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
    const code = document.getElementById('otp-code').value;
    window.confirmationResult.confirm(code).then(async (result) => {
        await checkUserRole(result.user);
    }).catch(() => { alert("Invalid OTP!"); });
});

// ৪. রোল চেক ও প্রোফাইল নেভিগেশন
async function checkUserRole(user) {
    const userDoc = await getDoc(doc(db, "Users", user.uid));
    
    if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.role) {
            window.location.href = "dashboard.html";
        } else {
            // যদি রোল না থাকে (নতুন ইউজার), পপআপ দেখাবে
            document.getElementById('role-modal').classList.remove('hidden');
            window.tempUserUid = user.uid;
        }
    } else {
        // ডাটাবেসে তথ্য না থাকলেও পপআপ দেখাবে
        document.getElementById('role-modal').classList.remove('hidden');
        window.tempUserUid = user.uid;
    }
}

// ৫. রোল সেট করা (পপআপ থেকে কল হবে)
window.setRole = async (role) => {
    const uid = window.tempUserUid || auth.currentUser.uid;
    const user = auth.currentUser;

    try {
        await setDoc(doc(db, "Users", uid), {
            name: user.displayName || "New Student",
            email: user.email || "",
            phone: user.phoneNumber || "",
            role: role,
            status: "Active",
            onboardingCompleted: false, // যাতে পরে অনবোর্ডিং পপআপ আসে
            myCourses: [],
            createdAt: new Date()
        }, { merge: true });

        alert("Welcome! Joining as a " + role);
        window.location.href = "dashboard.html";
    } catch (e) {
        alert("Error setting role. Try again.");
    }
};