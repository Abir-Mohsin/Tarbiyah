import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* আপনার কনফিগারেশন */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ১. স্লাইডার লোড করা
async function loadSlides() {
    const slider = document.getElementById('home-slider');
    const snap = await getDocs(query(collection(db, "HomepageSlides"), orderBy("createdAt", "desc")));
    
    if (snap.empty) return;
    slider.innerHTML = "";

    snap.forEach((doc, index) => {
        const slide = doc.data();
        slider.innerHTML += `
            <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image}')">
                <div class="slide-overlay">
                    <h2>${slide.title}</h2>
                    <a href="courses.html" class="btn">Start Learning</a>
                </div>
            </div>`;
    });

    // স্লাইডার অ্যানিমেশন লজিক
    let currentSlide = 0;
    setInterval(() => {
        const slides = document.querySelectorAll('.slide');
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

// ২. ভিডিও রিভিউ লোড করা
async function loadVideoReviews() {
    const list = document.getElementById('video-reviews-list');
    const snap = await getDocs(collection(db, "VideoReviews"));
    list.innerHTML = "";
    snap.forEach(doc => {
        const rev = doc.data();
        list.innerHTML += `
            <div class="video-card">
                <div class="video-container">
                    <iframe src="https://www.youtube.com/embed/${rev.youtubeId}" frameborder="0" allowfullscreen></iframe>
                </div>
                <div class="video-info"><h4>${rev.name}</h4></div>
            </div>`;
    });
}

window.onload = () => { loadSlides(); loadVideoReviews(); };