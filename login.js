/* 
   Tarbiyah Login Logic (login.js)
   ফিচার: অথেনটিকেশন এবং অ্যাডমিন অ্যাপ্রুভাল চেক।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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

const auth = getAuth(app);

// ১. Recaptcha সেটাআপ
window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
    'size': 'invisible'
});

// ২. ওটিপি পাঠানো
document.getElementById('send-otp-btn')?.addEventListener('click', () => {
    const phoneNumber = document.getElementById('phone-number').value;
    const appVerifier = window.recaptchaVerifier;

    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            document.getElementById('otp-input-area').classList.remove('hidden');
            alert("OTP Sent!");
        }).catch((error) => { alert("Error: " + error.message); });
});

// ৩. ওটিপি ভেরিফাই
document.getElementById('verify-otp-btn')?.addEventListener('click', () => {
    const code = document.getElementById('otp-code').value;
    window.confirmationResult.confirm(code).then((result) => {
        checkUserRole(result.user);
    }).catch(() => { alert("Invalid OTP!"); });
});

// ৪. রোল চেক ফাংশন
async function checkUserRole(user) {
    const userDoc = await getDoc(doc(db, "Users", user.uid));
    if (userDoc.exists() && userDoc.data().role) {
        window.location.href = "dashboard.html";
    } else {
        // রোল না থাকলে পপআপ দেখাবে
        document.getElementById('role-modal').classList.remove('hidden');
        window.tempUser = user;
    }
}

// ৫. রোল সেট করা
window.setRole = async (role) => {
    const user = window.tempUser || auth.currentUser;
    await setDoc(doc(db, "Users", user.uid), {
        uid: user.uid,
        email: user.email || "",
        phone: user.phoneNumber || "",
        role: role,
        status: "Active",
        createdAt: new Date()
    }, { merge: true });

    alert("Role set as " + role);
    window.location.href = "dashboard.html";
};