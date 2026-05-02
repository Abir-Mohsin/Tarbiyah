import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// আপনার অরিজিনাল কনফিগারেশন
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

// ১. স্লাইডার লোড করা
async function loadSlides() {
    const slider = document.getElementById('home-slider');
    if(!slider) return;

    try {
        const q = query(collection(db, "HomepageSlides"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        if (snap.empty) {
            console.log("No slides found in Firestore.");
            return;
        }

        slider.innerHTML = "";
        let index = 0;
        snap.forEach((doc) => {
            const slide = doc.data();
            slider.innerHTML += `
                <div class="slide ${index === 0 ? 'active' : ''}" style="background-image: url('${slide.image}')">
                    <div class="slide-overlay">
                        <h2>${slide.title}</h2>
                        <a href="courses.html" class="btn">Start Learning</a>
                    </div>
                </div>`;
            index++;
        });

        startSliderAnimation();
    } catch (e) { console.error("Slider error:", e); }
}

function startSliderAnimation() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    if(slides.length <= 1) return;

    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, 5000);
}

// ২. ভিডিও রিভিউ লোড করা (উন্নত ভার্সন)
async function loadVideoReviews() {
    const list = document.getElementById('video-reviews-list');
    if(!list) return;

    try {
        const snap = await getDocs(collection(db, "VideoReviews"));
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = "<p>No video reviews yet.</p>";
            return;
        }

        snap.forEach(doc => {
            const rev = doc.data();
            // লিঙ্ক থেকে আইডি বের করার লজিক (যদি পুরো লিঙ্ক দেওয়া হয়)
            let videoId = rev.youtubeId;
            if (videoId.includes('v=')) videoId = videoId.split('v=')[1].split('&')[0];
            else if (videoId.includes('youtu.be/')) videoId = videoId.split('youtu.be/')[1].split('?')[0];

            list.innerHTML += `
                <div class="video-card">
                    <div class="video-container">
                        <iframe src="https://www.youtube.com/embed/${videoId}" title="YouTube video player" frameborder="0" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                    </div>
                    <div class="video-info"><h4>${rev.name}</h4></div>
                </div>`;
        });
    } catch (e) { console.error("Video error:", e); }
}

// পেজ লোড হলে রান হবে
window.addEventListener('DOMContentLoaded', () => {
    loadSlides();
    loadVideoReviews();
});