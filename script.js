/* 
   Tarbiyah Global Script (script.js)
   ফিচার: মোবাইল মেনু, ডার্ক মোড, অ্যাডমিশন ও কন্টাক্ট ফর্ম, এবং অথেনটিকেশন স্টেট।
*/

// ১. Firebase এবং Auth ইমপোর্ট করা (সব ইমপোর্ট উপরে থাকতে হবে)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// আপনার দেওয়া ফায়ারবেস কনফিগারেশন (অপরিবর্তিত)
const firebaseConfig = {
    apiKey: "AIzaSyByrLkl4953IvCNyVD7jXWUAvj-9AWfD10", 
    authDomain: "tarbiyah-a27d3.firebaseapp.com",
    projectId: "tarbiyah-a27d3",
    storageBucket: "tarbiyah-a27d3.firebasestorage.app",
    messagingSenderId: "1072439212695",
    appId: "1:1072439212695:web:acdfa80a7a6b88f14c87d2",
    measurementId: "G-S832D4HJQL"
};

// Firebase এবং Firestore চালু করা
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// ২. মোবাইল নেভিগেশন মেনু (Hamburger Menu)
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

if (hamburger) {
    hamburger.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });
}


// ৩. ডার্ক মোড লজিক
const darkModeToggle = document.getElementById('dark-mode-toggle');
const body = document.body;

// লোকাল স্টোরেজ চেক করা
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


// ৪. স্মার্ট মেনুবার (লগইন থাকলে বাটন Dashboard হয়ে যাবে)
onAuthStateChanged(auth, (user) => {
    // এই আইডিটি আপনার সব HTML ফাইলের লগইন বাটনে থাকতে হবে
    const authBtn = document.getElementById('nav-auth-btn'); 
    
    if (authBtn) {
        if (user) {
            // ইউজার লগইন থাকলে
            authBtn.innerText = "My Dashboard";
            authBtn.href = "dashboard.html";
            authBtn.classList.add('btn'); // সিএসএস বাটন স্টাইল যোগ করবে
        } else {
            // লগইন না থাকলে
            authBtn.innerText = "Student Login";
            authBtn.href = "login.html";
        }
    }
});


// ৫. অ্যাডমিশন ফর্ম সাবমিশন (পেমেন্ট ভেরিফিকেশনের জন্য)
const admissionForm = document.getElementById('admission-form');
if (admissionForm) {
    admissionForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = admissionForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Submitting...";
        submitBtn.disabled = true;

        const formData = {
            name: document.getElementById('name').value,
            email: document.getElementById('email').value,
            phone: document.getElementById('phone').value,
            course: document.getElementById('course').value,
            trxId: document.getElementById('trxId').value,
            message: admissionForm.querySelector('textarea').value,
            status: "Pending", // অ্যাডমিন পরে এটাকে Approved করবে
            timestamp: new Date()
        };

        try {
            await addDoc(collection(db, "Admissions"), formData);
            alert('Alhamdulillah! Your admission form is submitted. Please sign up an account if you haven\'t already.');
            admissionForm.reset();
        } catch (error) {
            console.error(error);
            alert('Submission failed. Please try again.');
        } finally {
            submitBtn.innerText = "Submit Application";
            submitBtn.disabled = false;
        }
    });
}


// ৬. কন্টাক্ট ফর্ম সাবমিশন
const contactForm = document.getElementById('contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const submitBtn = contactForm.querySelector('button[type="submit"]');
        submitBtn.innerText = "Sending...";
        submitBtn.disabled = true;

        const name = contactForm.querySelector('input[type="text"]').value;
        const email = contactForm.querySelector('input[type="email"]').value;
        const message = contactForm.querySelector('textarea').value;

        try {
            await addDoc(collection(db, "Contacts"), {
                name, email, message, timestamp: new Date()
            });
            alert('Message sent successfully!');
            contactForm.reset();
        } catch (error) {
            alert('Error sending message.');
        } finally {
            submitBtn.innerText = "Send Message";
            submitBtn.disabled = false;
        }
    });
}

async function loadSettings() {
    const docSnap = await getDoc(doc(db, "Settings", "global"));
    if (docSnap.exists()) {
        const data = docSnap.data();
        // লোগো টেক্সট পরিবর্তন
        const logo = document.querySelector('.logo h1');
        if(logo) logo.innerText = data.siteName;
        document.title = data.siteName;
    }
}
loadSettings();

// script.js এর একদম নিচে যোগ করুন (Dynamic Theming Engine)
import { onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

function applyDynamicTheme() {
    onSnapshot(doc(db, "Settings", "theme"), (docSnap) => {
        if (docSnap.exists()) {
            const theme = docSnap.data();

            // ১. কালার পরিবর্তন (CSS Variables আপডেট করা)
            if(theme.primaryColor) document.documentElement.style.setProperty('--primary-green', theme.primaryColor);
            if(theme.accentColor) document.documentElement.style.setProperty('--soft-gold', theme.accentColor);

            // ২. লোগো পরিবর্তন (ছবি নাকি টেক্সট)
            const logoContainers = document.querySelectorAll('.logo a, .logo');
            logoContainers.forEach(container => {
                if (theme.logoImg) {
                    // যদি ছবির লিঙ্ক থাকে, ছবি দেখাবে
                    container.innerHTML = `<img src="${theme.logoImg}" alt="${theme.siteName}" style="max-height: 50px;">`;
                } else {
                    // ছবি না থাকলে টেক্সট দেখাবে
                    container.innerHTML = `<h1>${theme.siteName}</h1>`;
                }
            });

            // ৩. ওয়েবসাইটের টাইটেল পরিবর্তন
            if(theme.siteName) document.title = theme.siteName + " | Education Platform";

            // ৪. কাস্টম গুগল ফন্ট যুক্ত করা
            if (theme.fontUrl) {
                let fontLink = document.getElementById('dynamic-font');
                if (!fontLink) {
                    fontLink = document.createElement('link');
                    fontLink.id = 'dynamic-font';
                    fontLink.rel = 'stylesheet';
                    document.head.appendChild(fontLink);
                }
                fontLink.href = theme.fontUrl;
                
                // ফন্টের নাম বের করে বডিতে বসানো (সাধারণ লজিক)
                const fontNameMatch = theme.fontUrl.match(/family=([^&:]+)/);
                if(fontNameMatch) {
                    const fontName = fontNameMatch[1].replace(/\+/g, ' ');
                    document.body.style.fontFamily = `'${fontName}', sans-serif`;
                }
            }
        }
    });
}

// থিম ফাংশন চালু করা
applyDynamicTheme();

// script.js এর ভেতরে স্মার্ট হেডার লজিক আপডেট
onAuthStateChanged(auth, (user) => {
    const loggedOutMenu = document.getElementById('logged-out-menu');
    const loggedInMenu = document.getElementById('logged-in-menu');

    if (user) {
        // ইউজার লগইন থাকলে
        if (loggedOutMenu) loggedOutMenu.classList.add('hidden');
        if (loggedInMenu) loggedInMenu.classList.remove('hidden');
        
        // (ঐচ্ছিক) ইউজারের নাম বা ছবি হেডারে দেখানো যেতে পারে ভবিষ্যতে
    } else {
        // লগইন না থাকলে
        if (loggedOutMenu) loggedOutMenu.classList.remove('hidden');
        if (loggedInMenu) loggedInMenu.classList.add('hidden');
    }
});

// Language Dictionary
const translations = {
    'en': {
        'home': 'Home',
        'courses': 'Courses',
        'login': 'Student Login',
        'search_placeholder': 'Search courses, books...'
    },
    'bn': {
        'home': 'হোম',
        'courses': 'কোর্সসমূহ',
        'login': 'লগইন করুন',
        'search_placeholder': 'কোর্স বা বই খুঁজুন...'
    }
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
    
    // ফিক্স: আগে চেক করবে সার্চ বক্সটি এই পেজে আছে কি না
    const searchInput = document.getElementById('site-search');
    if (searchInput) {
        searchInput.placeholder = translations[currentLang].search_placeholder;
    }
}
applyLanguage();

// --- Global Search Logic ---
const searchForm = document.getElementById('global-search-form');
if (searchForm) {
    searchForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const query = document.getElementById('site-search').value.trim();
        if (query) {
            // ইউজারকে কোর্স পেজে পাঠাবে এবং ইউআরএল এ সার্চ কিওয়ার্ড দিয়ে দিবে
            window.location.href = `courses.html?q=${encodeURIComponent(query)}`;
        }
    });
}

// ইউআরএল থেকে বইয়ের তথ্য চেক করা
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('type') === 'book') {
    const bookTitle = urlParams.get('title');
    const bookPrice = urlParams.get('price');
    
    // কোর্সের ড্রপডাউনে বইয়ের নাম যোগ করা বা মেসেজ দেওয়া
    const courseSelect = document.getElementById('course');
    if (courseSelect) {
        courseSelect.innerHTML = `<option value="${bookTitle}" selected>Buying Book: ${bookTitle} (${bookPrice} BDT)</option>`;
    }
}

// --- অ্যাডমিশন ফর্মের ড্রপডাউন ডাইনামিক করা ---
async function populateAdmissionDropdown() {
    const courseSelect = document.getElementById('course');
    if (!courseSelect) return;

    // যদি ইউআরএল এ অলরেডি কোনো বইয়ের নাম থাকে (Buy Now বাটন থেকে আসলে)
    const urlParams = new URLSearchParams(window.location.search);
    const preSelected = urlParams.get('title');

    courseSelect.innerHTML = '<option value="">-- Select Course or Book --</option>';

    try {
        // ১. কোর্সগুলো যোগ করা
        const courseSnap = await getDocs(collection(db, "Courses"));
        courseSelect.innerHTML += `<optgroup label="Academic Courses">`;
        courseSnap.forEach(doc => {
            const c = doc.data();
            courseSelect.innerHTML += `<option value="${c.title}" ${preSelected === c.title ? 'selected' : ''}>${c.title}</option>`;
        });
        courseSelect.innerHTML += `</optgroup>`;

        // ২. বইগুলো যোগ করা
        const bookSnap = await getDocs(collection(db, "Books"));
        courseSelect.innerHTML += `<optgroup label="PDF Books">`;
        bookSnap.forEach(doc => {
            const b = doc.data();
            courseSelect.innerHTML += `<option value="${b.title}" ${preSelected === b.title ? 'selected' : ''}>Buy Book: ${b.title}</option>`;
        });
        courseSelect.innerHTML += `</optgroup>`;

    } catch (e) { console.log("Dropdown load failed", e); }
}

// পেজ লোড হলে রান হবে
window.addEventListener('DOMContentLoaded', populateAdmissionDropdown);

// script.js এর ভেতর ল্যাঙ্গুয়েজ লজিক
const translations = {
    'en': {
        'nav_home': 'Home',
        'nav_courses': 'Courses',
        'nav_login': 'Student Login',
        'hero_title': 'Empowering the Ummah',
        'welcome_msg': 'Assalamu Alaikum',
    },
    'bn': {
        'nav_home': 'হোম',
        'nav_courses': 'কোর্সসমূহ',
        'nav_login': 'লগইন করুন',
        'hero_title': 'উম্মাহর ক্ষমতায়ন',
        'welcome_msg': 'আসসালামু আলাইকুম',
    }
};

window.changeLanguage = (lang) => {
    localStorage.setItem('lang', lang);
    document.querySelectorAll('[data-lang-key]').forEach(el => {
        const key = el.getAttribute('data-lang-key');
        if (translations[lang][key]) {
            el.innerText = translations[lang][key];
        }
    });
    document.getElementById('lang-switch').innerText = (lang === 'bn' ? 'EN' : 'বাং');
};

// ব্যবহারের নিয়ম: HTML এ গিয়ে নিচের মতো লিখতে হবে
// <a href="index.html" data-lang-key="nav_home">Home</a>

// গ্লোবাল সার্চ লজিক
window.performGlobalSearch = async () => {
    const queryStr = document.getElementById('site-search').value.toLowerCase();
    if(!queryStr) return;

    // ইউজারকে একটি সার্চ রেজাল্ট পেজে নিয়ে যাওয়া ভালো, 
    // তবে আপাতত আমরা কোর্স পেজেই সব দেখানোর ব্যবস্থা করছি
    window.location.href = `courses.html?search=${encodeURIComponent(queryStr)}`;
};

// courses.js এ গিয়ে এই কুয়েরি হ্যান্ডেল করতে হবে
const urlParams = new URLSearchParams(window.location.search);
const searchTerm = urlParams.get('search')?.toLowerCase();

if (searchTerm) {
    // এখানে আপনার কোর্সের পাশাপাশি বই এবং রিসার্চও ফিল্টার করে দেখাবে
}