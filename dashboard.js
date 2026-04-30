/* 
   Tarbiyah Student Dashboard Logic (dashboard.js)
   ফিচার: কোর্স সিলেকশন, ডাইনামিক ভিডিও প্লেলিস্ট, প্রগ্রেস ট্র্যাকিং এবং কমেন্ট সিস্টেম।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

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
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, "Users", user.uid));
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('student-name').innerText = userData.name || "Student";
            
            if (userData.status === "Approved") {
                const myCourses = userData.myCourses || [];
                renderEnrolledCourses(myCourses);
            } else {
                alert("Your account is pending approval.");
                signOut(auth);
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

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