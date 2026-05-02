/* 
   Tarbiyah Global Script (script.js) - Master Version
   ফিচার: নোটিফিকেশন পপআপ, ডাইনামিক থিম, স্মার্ট হেডার, ডার্ক মোড এবং ফর্ম।
*/

// ১. সব Import একসাথে ফাইলের শুরুতে থাকতে হবে
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, doc, getDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ২. ফায়ারবেস কনফিগারেশন
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
const db = getFirestore(app);
const auth = getAuth(app);


// ৩. মোবাইল নেভিগেশন (Hamburger Menu)
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}


// ৪. ডার্ক মোড লজিক
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

if (localStorage.getItem('darkMode') === 'enabled') {
    body.classList.add('dark-mode');
    if(darkModeToggle) darkModeToggle.innerHTML = '☀️';
}

if(darkModeToggle) {
    darkModeToggle.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        if (body.classList.contains('dark-mode')) {
            localStorage.setItem('darkMode', 'enabled');
            darkModeToggle.innerHTML = '☀️';
        } else {
            localStorage.setItem('darkMode', 'disabled');
            darkModeToggle.innerHTML = '🌙';
        }
    });
}


// ৫. স্মার্ট হেডার (লগইন চেক করে মেনু পরিবর্তন করা)
onAuthStateChanged(auth, (user) => {
    const loggedOutMenu = document.getElementById('logged-out-menu');
    const loggedInMenu = document.getElementById('logged-in-menu');
    const authBtn = document.getElementById('nav-auth-btn'); // পুরানো পেজগুলোর জন্য

    if (user) {
        // লগইন থাকলে
        if (loggedOutMenu) loggedOutMenu.classList.add('hidden');
        if (loggedInMenu) loggedInMenu.classList.remove('hidden');
        if (authBtn) { authBtn.innerText = "My Dashboard"; authBtn.href = "dashboard.html"; }
    } else {
        // লগইন না থাকলে
        if (loggedOutMenu) loggedOutMenu.classList.remove('hidden');
        if (loggedInMenu) loggedInMenu.classList.add('hidden');
        if (authBtn) { authBtn.innerText = "Student Login"; authBtn.href = "login.html"; }
    }
});


// ৬. নোটিফিকেশন পপআপ লজিক (যা আপনার ফাইলে মিসিং ছিল)
function syncNotifications() {
    const badge = document.querySelector('.notify-badge');
    const bell = document.querySelector('.notification-bell');

    // পপআপ HTML বডিতে যুক্ত করা (যদি আগে না থাকে)
    if (!document.getElementById('notice-modal')) {
        const modalHtml = `
        <div id="notice-modal" class="hidden" style="position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.8); z-index:9999; display:flex; justify-content:center; align-items:center;">
            <div style="background:var(--card-bg); padding:30px; border-radius:10px; max-width:400px; text-align:center; border-top: 4px solid var(--soft-gold); box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
                <h3 style="color:var(--primary-green); margin-bottom:15px;"><i class="fas fa-bell"></i> New Announcement</h3>
                <p id="notice-text" style="color:var(--text-dark); font-size:1.1rem; margin-bottom:25px; line-height:1.6;"></p>
                <button id="close-notice" class="btn" style="width:100%;">Mark as Read & Close</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', modalHtml);
    }

    // ফায়ারবেস থেকে রিয়েল-টাইম নোটিশ শোনা
    onSnapshot(doc(db, "Settings", "notification"), (docSnap) => {
        if (docSnap.exists()) {
            const data = docSnap.data();
            if (badge) { badge.innerText = "1"; badge.style.background = "red"; }
            
            // বেল আইকনে ক্লিক করলে পপআপ আসবে
            if (bell) {
                bell.onclick = (e) => {
                    e.preventDefault();
                    document.getElementById('notice-text').innerText = data.message;
                    document.getElementById('notice-modal').classList.remove('hidden');
                    if (badge) { badge.innerText = "0"; badge.style.background = "gray"; }
                };
            }
        }
    });

    // পপআপ ক্লোজ করা
    document.body.addEventListener('click', (e) => {
        if (e.target.id === 'close-notice') {
            document.getElementById('notice-modal').classList.add('hidden');
        }
    });
}
syncNotifications(); // ফাংশনটি চালু করা হলো


// ৭. ডাইনামিক থিম ইঞ্জিন (লোগো, ফন্ট ও কালার পরিবর্তন)
function applyDynamicTheme() {
    onSnapshot(doc(db, "Settings", "theme"), (docSnap) => {
        if (docSnap.exists()) {
            const theme = docSnap.data();

            if(theme.primaryColor) document.documentElement.style.setProperty('--primary-green', theme.primaryColor);
            if(theme.accentColor) document.documentElement.style.setProperty('--soft-gold', theme.accentColor);

            const logoContainers = document.querySelectorAll('.logo a, .logo');
            logoContainers.forEach(container => {
                if (theme.logoImg) {
                    container.innerHTML = `<img src="${theme.logoImg}" alt="${theme.siteName}" style="max-height: 50px;">`;
                } else {
                    container.innerHTML = `<h1>${theme.siteName}</h1>`;
                }
            });

            if(theme.siteName) document.title = theme.siteName + " | Education Platform";

            if (theme.fontUrl) {
                let fontLink = document.getElementById('dynamic-font');
                if (!fontLink) {
                    fontLink = document.createElement('link');
                    fontLink.id = 'dynamic-font';
                    fontLink.rel = 'stylesheet';
                    document.head.appendChild(fontLink);
                }
                fontLink.href = theme.fontUrl;
                const fontNameMatch = theme.fontUrl.match(/family=([^&:]+)/);
                if(fontNameMatch) document.body.style.fontFamily = `'${fontNameMatch[1].replace(/\+/g, ' ')}', sans-serif`;
            }
        }
    });
}
applyDynamicTheme(); // ফাংশনটি চালু করা হলো


// ৮. ভাষা পরিবর্তন (Language Switcher)
const translations = {
    'en': { 'search_placeholder': 'Search courses, books...' },
    'bn': { 'search_placeholder': 'কোর্স বা বই খুঁজুন...' }
};

let currentLang = localStorage.getItem('lang') || 'en';

document.getElementById('lang-switch')?.addEventListener('click', () => {
    currentLang = currentLang === 'en' ? 'bn' : 'en';
    localStorage.setItem('lang', currentLang);
    applyLanguage();
});

function applyLanguage() {
    const btn = document.getElementById('lang-switch');
    if(btn) btn.innerText = currentLang === 'en' ? 'বাং' : 'EN';
    
    const searchInput = document.getElementById('site-search');
    if (searchInput) {
        searchInput.placeholder = translations[currentLang].search_placeholder;
    }
}
applyLanguage();


// ৯. ফর্ম সাবমিশন (Admission & Contact)
const admissionForm = document.getElementById('admission-form');
if (admissionForm) {
    admissionForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = admissionForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Submitting..."; submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value, email: document.getElementById('email').value,
            phone: document.getElementById('phone').value, course: document.getElementById('course').value,
            trxId: document.getElementById('trxId').value, message: admissionForm.querySelector('textarea').value,
            status: "Pending", timestamp: new Date()
        };

        try {
            await addDoc(collection(db, "Admissions"), formData);
            alert('Alhamdulillah! Your admission form is submitted.');
            admissionForm.reset();
        } catch (error) { alert('Submission failed. Please try again.'); } 
        finally { submitBtn.innerText = "Submit Application"; submitBtn.disabled = false; }
    });
}

const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();
        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Sending..."; submitBtn.disabled = true;

        try {
            await addDoc(collection(db, "Contacts"), {
                name: contactForm.querySelector('input[type="text"]').value, 
                email: contactForm.querySelector('input[type="email"]').value, 
                message: contactForm.querySelector('textarea').value, 
                timestamp: new Date()
            });
            alert('Message sent successfully!'); contactForm.reset();
        } catch (error) { alert('Error sending message.'); } 
        finally { submitBtn.innerText = "Send Message"; submitBtn.disabled = false; }
    });
}