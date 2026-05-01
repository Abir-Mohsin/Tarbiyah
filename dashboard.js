/* 
   Tarbiyah Student Dashboard Logic (dashboard.js)
   ফিচার: কোর্স সিলেকশন, ডাইনামিক ভিডিও প্লেলিস্ট, প্রগ্রেস ট্র্যাকিং এবং কমেন্ট সিস্টেম।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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
const db = getFirestore(app);
const auth = getAuth(app);

// গ্লোবাল স্টেট
let currentVideoId = "";
let currentCourseVideos = [];
let completedVideos = JSON.parse(localStorage.getItem('completedVideos')) || [];

// ২. অথেনটিকেশন চেক এবং প্রোফাইল লোড করা
let currentUserRef = null;

onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(currentUserRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('student-name').innerText = userData.name || "Student";
            
            // Stats Update
            const myCourses = userData.myCourses ||[];
            document.getElementById('stat-courses').innerText = myCourses.length;

            // Onboarding Check
            if (!userData.onboardingCompleted) {
                document.getElementById('onboarding-modal').classList.remove('hidden');
            } else {
                renderEnrolledCourses(myCourses);
                loadExploreCourses(userData.interests ||[]);
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

// Onboarding Keyword Selection Logic
let selectedKeywords = [];

document.querySelectorAll('.keyword-badge').forEach(badge => {
    badge.addEventListener('click', () => {
        const val = badge.getAttribute('data-val');
        if (selectedKeywords.includes(val)) {
            selectedKeywords = selectedKeywords.filter(k => k !== val);
            badge.classList.remove('selected');
        } else {
            selectedKeywords.push(val);
            badge.classList.add('selected');
        }
    });
});

// অনবোর্ডিং সেভ করা
document.getElementById('complete-onboarding-btn')?.addEventListener('click', async () => {
    if (selectedKeywords.length === 0) return alert("Please select at least one interest.");

    const profilePic = document.getElementById('ob-profile-pic').value;

    try {
        await updateDoc(currentUserRef, {
            interests: selectedKeywords,
            profilePic: profilePic,
            onboardingCompleted: true
        });
        document.getElementById('onboarding-modal').classList.add('hidden');
        location.reload(); // ডাটা আপডেট করে পেজ রিফ্রেশ
    } catch (e) { alert("Error saving profile!"); }
});

// ড্যাশবোর্ড ট্যাব সুইচিং লজিক
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');

        // ট্যাব বাটন পরিবর্তন
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // সেকশন পরিবর্তন
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target).classList.add('active');
    });
});

// Explore ট্যাব এর জন্য কোর্স লোড করা
async function loadExploreCourses(userInterests) {
    const freeArea = document.getElementById('free-courses-list'); // HTML এ এই ID টি দিতে হবে
    const premiumArea = document.getElementById('premium-courses-list'); 

    const q = query(collection(db, "Courses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    let freeHtml = "";
    let premiumHtml = "";

    snap.forEach(doc => {
        const course = doc.data();
        const card = `
            <div class="card">
                <img src="${course.image}" style="width:100%">
                <h3>${course.title}</h3>
                <p>${course.price == 0 ? 'FREE' : 'Price: ' + course.price}</p>
                <button class="btn">${course.price == 0 ? 'Start Now' : 'Enroll Now'}</button>
            </div>
        `;

        if (course.price == 0 || course.type === "free") {
            freeHtml += card;
        } else {
            premiumHtml += card;
        }
    });

    if(freeArea) freeArea.innerHTML = freeHtml || "No free courses yet.";
    if(premiumArea) premiumArea.innerHTML = premiumHtml || "No premium courses yet.";
    // ইন্টারেস্ট অনুযায়ী রেকমেন্ডেশন হাইলাইট করা এডিট করা
    const exploreList = document.getElementById('explore-courses-list');
    const q = query(collection(db, "Courses"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    exploreList.innerHTML = "";
    snap.forEach(doc => {
        const course = doc.data();
        // যদি ছাত্রের ইন্টারেস্টের সাথে কোর্স ট্যাগ মিলে যায়, তবে সেগুলোকে হাইলাইট করা যায়
        const isRecommended = userInterests.includes(course.tag);

        exploreList.innerHTML += `
            <div class="card" style="${isRecommended ? 'border: 2px solid var(--soft-gold)' : ''}">
                ${isRecommended ? '<small style="color:var(--soft-gold)">Recommended for you</small>' : ''}
                <img src="${course.image}" style="width:100%; border-radius:8px;">
                <h3>${course.title}</h3>
                <p>Price: ${course.price}</p>
                <a href="admission.html" class="btn">View Details</a>
            </div>
        `;
    });
}

// ৩. কেনা কোর্সগুলোর তালিকা দেখানো
function renderEnrolledCourses(courses) {
    const listArea = document.getElementById('enrolled-courses-list');
    if (courses.length === 0) {
        listArea.innerHTML = "<p>You haven't enrolled in any courses yet.</p>";
        return;
    }

    listArea.innerHTML = "";
    courses.forEach(courseName => {
        const card = document.createElement('div');
        card.className = "card";
        card.innerHTML = `
            <h3>${courseName}</h3>
            <button class="btn" onclick="startCourse('${courseName}')">Continue Lesson</button>
        `;
        listArea.appendChild(card);
    });
}

// ৪. নির্দিষ্ট কোর্স লোড করা (ভিডিও প্লেয়ার ওপেন করা)
window.startCourse = async (courseName) => {
    document.getElementById('course-selection').style.display = "none";
    document.getElementById('learning-area').style.display = "block";
    document.getElementById('course-title').innerText = courseName;

    const videoListArea = document.getElementById('video-list');
    videoListArea.innerHTML = "Loading lessons...";

    // Firestore থেকে ভিডিওগুলো আনা
    const q = query(collection(db, "Videos"), where("course", "==", courseName), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    currentCourseVideos = [];
    querySnapshot.forEach(doc => {
        currentCourseVideos.push({ id: doc.id, ...doc.data() });
    });

    if (currentCourseVideos.length > 0) {
        renderPlaylist();
        playVideo(currentCourseVideos[0]); // প্রথম ভিডিওটি চালু করা
    } else {
        videoListArea.innerHTML = "No lessons found for this course.";
    }
};

// ৫. প্লেলিস্ট রেন্ডার করা
function renderPlaylist() {
    const videoListArea = document.getElementById('video-list');
    videoListArea.innerHTML = "";

    currentCourseVideos.forEach(video => {
        const isDone = completedVideos.includes(video.id) ? "✅" : "";
        const div = document.createElement('div');
        div.className = `playlist-item ${video.id === currentVideoId ? 'active' : ''}`;
        div.innerHTML = `<span>${video.title}</span> <span>${isDone}</span>`;
        div.onclick = () => playVideo(video);
        videoListArea.appendChild(div);
    });
    updateProgress();
}

// ৬. ভিডিও প্লে করা
function playVideo(video) {
    currentVideoId = video.id;
    document.getElementById('video-frame').src = video.url;
    renderPlaylist();
    loadComments();
}

// ৭. প্রগ্রেস আপডেট করা
function updateProgress() {
    const total = currentCourseVideos.length;
    const done = currentCourseVideos.filter(v => completedVideos.includes(v.id)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const bar = document.getElementById('progress-bar');
    bar.style.width = percent + "%";
    bar.innerText = percent + "% Progress";
}

// ৮. ভিডিও কমপ্লিট মার্ক করা
document.getElementById('mark-complete-btn').addEventListener('click', () => {
    if (currentVideoId && !completedVideos.includes(currentVideoId)) {
        completedVideos.push(currentVideoId);
        localStorage.setItem('completedVideos', JSON.stringify(completedVideos));
        renderPlaylist();
    }
});

// ৯. কমেন্ট সিস্টেম (Discussion)
document.getElementById('post-comment-btn').addEventListener('click', async () => {
    const input = document.getElementById('comment-input');
    const text = input.value.trim();
    if (!text || !currentVideoId) return;

    try {
        await addDoc(collection(db, "Comments"), {
            videoId: currentVideoId,
            text: text,
            studentName: document.getElementById('student-name').innerText,
            timestamp: new Date()
        });
        input.value = "";
        loadComments();
    } catch (e) { alert("Error posting comment."); }
});

async function loadComments() {
    const list = document.getElementById('comments-list');
    list.innerHTML = "Loading comments...";
    const q = query(collection(db, "Comments"), where("videoId", "==", currentVideoId), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    
    list.innerHTML = "";
    snap.forEach(doc => {
        const c = doc.data();
        list.innerHTML += `<div class="comment-item"><strong>${c.studentName}</strong>: ${c.text}</div>`;
    });
}

// ১০. লগআউট
document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});

// dashboard.js এর শেষে এই মাস্টার ফাংশনগুলো যোগ করুন

// ১. সার্টিফিকেট জেনারেট করার ফাংশন (PDF)
window.downloadCertificate = (courseName, studentName) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({
        orientation: 'landscape'
    });

    // ডিজাইনের কাজ (গোল্ডেন বর্ডার)
    doc.setDrawColor(212, 175, 55); 
    doc.setLineWidth(10);
    doc.rect(10, 10, 277, 190);

    // টেক্সট বসানো
    doc.setFont("Amiri", "bold");
    doc.setFontSize(40);
    doc.setTextColor(27, 67, 50); // Primary Green
    doc.text("Certificate of Completion", 148, 60, { align: "center" });

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text("This is to certify that", 148, 90, { align: "center" });

    doc.setFontSize(30);
    doc.setTextColor(212, 175, 55); // Gold
    doc.text(studentName, 148, 110, { align: "center" });

    doc.setFontSize(20);
    doc.setTextColor(0, 0, 0);
    doc.text(`has successfully completed the course`, 148, 130, { align: "center" });
    
    doc.setFont("Amiri", "bold");
    doc.text(courseName, 148, 150, { align: "center" });

    doc.setFontSize(14);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 148, 180, { align: "center" });

    // PDF ডাউনলোড
    doc.save(`${studentName}-${courseName}-Certificate.pdf`);
};

// ২. কুইজ লোড করার লজিক
window.loadQuiz = async (courseTag) => {
    const quizArea = document.getElementById('quiz-area');
    quizArea.innerHTML = "Loading Quiz...";

    const q = query(collection(db, "Quizzes"), where("course", "==", courseTag));
    const snap = await getDocs(q);

    if (snap.empty) {
        quizArea.innerHTML = "No quiz available for this course yet.";
        return;
    }

    let quizHtml = `<form id="active-quiz">`;
    snap.forEach(doc => {
        const data = doc.data();
        quizHtml += `
            <div class="form-group">
                <p><strong>${data.question}</strong></p>
                ${data.options.map(opt => `<label><input type="radio" name="${doc.id}" value="${opt}"> ${opt}</label><br>`).join('')}
            </div><hr>
        `;
    });
    quizHtml += `<button type="submit" class="btn">Submit Exam</button></form>`;
    quizArea.innerHTML = quizHtml;

    // কুইজ সাবমিট হ্যান্ডলার
    document.getElementById('active-quiz').onsubmit = async (e) => {
        e.preventDefault();
        alert("Submitting... InshaAllah you will get the result soon.");
        // এখানে রেজাল্ট ক্যালকুলেশন এবং ডাটাবেসে সেভ করার কোড থাকবে
    };
};