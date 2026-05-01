/* 
   Tarbiyah Student Dashboard Logic (dashboard.js)
   Features: Onboarding, Dynamic Filtering, Quiz, Certificate and Tab Switching.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc 
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
let currentUserRef = null;

// ২. অথেনটিকেশন চেক এবং ড্যাশবোর্ড লোড করা
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(currentUserRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('student-name').innerText = userData.name || "Student";
            
            // অনবোর্ডিং চেক করা
            if (userData.onboardingCompleted === false) {
                document.getElementById('onboarding-modal').classList.remove('hidden');
                setupOnboarding();
            } else {
                loadStudentDashboard(userData);
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

// ৩. অনবোর্ডিং লজিক (পছন্দের কিওয়ার্ড সেভ)
function setupOnboarding() {
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

    document.getElementById('complete-onboarding-btn')?.addEventListener('click', async () => {
        const pic = document.getElementById('ob-profile-pic').value;
        if (selectedKeywords.length === 0) return alert("Please select at least one keyword!");

        try {
            await updateDoc(currentUserRef, {
                profilePic: pic,
                interests: selectedKeywords,
                onboardingCompleted: true
            });
            alert("MashaAllah! Profile personalized successfully.");
            location.reload();
        } catch (e) {
            alert("Error updating profile.");
        }
    });
}

// ৪. স্টুডেন্ট ড্যাশবোর্ড লোড করা (Stats & Explore)
async function loadStudentDashboard(userData) {
    document.getElementById('stat-courses').innerText = userData.myCourses ? userData.myCourses.length : 0;
    document.getElementById('stat-books').innerText = userData.myBooks ? userData.myBooks.length : 0;

    renderEnrolledCourses(userData.myCourses || []);
    loadExploreCourses(userData.interests || []);
}

// ৫. কেনা কোর্সগুলোর তালিকা দেখানো
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

// ৬. এক্সপ্লোর ট্যাবে সাজেস্টেড কোর্স দেখানো (ফ্রি ও প্রিমিয়াম ফিল্টার)
async function loadExploreCourses(userInterests) {
    const exploreList = document.getElementById('explore-courses-list');
    if(!exploreList) return;

    try {
        const q = query(collection(db, "Courses"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        exploreList.innerHTML = "";
        if(snap.empty) {
            exploreList.innerHTML = "<p>No courses available at the moment.</p>";
            return;
        }

        snap.forEach(doc => {
            const course = doc.data();
            const isRecommended = userInterests.includes(course.tag);

            exploreList.innerHTML += `
                <div class="card" style="${isRecommended ? 'border: 2px solid var(--soft-gold);' : ''}">
                    ${isRecommended ? '<small style="color:var(--soft-gold); font-weight:bold;">Recommended for you</small>' : ''}
                    <img src="${course.image || 'https://via.placeholder.com/300'}" style="width:100%; border-radius:8px; height:160px; object-fit:cover;">
                    <h3>${course.title}</h3>
                    <p style="color:var(--primary-green); font-weight:bold;">${course.price == 0 ? 'FREE' : course.price + ' BDT'}</p>
                    <a href="admission.html" class="btn" style="margin-top:10px;">Enroll Now</a>
                </div>
            `;
        });
    } catch (e) {
        exploreList.innerHTML = "Error loading recommendations.";
    }
}

// ৭. নির্দিষ্ট কোর্স লোড করা (ভিডিও প্লেয়ার ওপেন করা)
window.startCourse = async (courseName) => {
    document.getElementById('course-selection').style.display = "none";
    document.getElementById('learning-area').style.display = "block";
    document.getElementById('course-title').innerText = courseName;

    const videoListArea = document.getElementById('video-list');
    videoListArea.innerHTML = "Loading lessons...";

    const q = query(collection(db, "Videos"), where("course", "==", courseName), orderBy("order", "asc"));
    const querySnapshot = await getDocs(q);
    
    currentCourseVideos = [];
    querySnapshot.forEach(doc => {
        currentCourseVideos.push({ id: doc.id, ...doc.data() });
    });

    if (currentCourseVideos.length > 0) {
        renderPlaylist();
        playVideo(currentCourseVideos[0]); 
    } else {
        videoListArea.innerHTML = "No lessons found for this course.";
    }
};

// ৮. প্লেলিস্ট রেন্ডার করা
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

function playVideo(video) {
    currentVideoId = video.id;
    document.getElementById('video-frame').src = video.url;
    renderPlaylist();
    loadComments();
}

function updateProgress() {
    const total = currentCourseVideos.length;
    const done = currentCourseVideos.filter(v => completedVideos.includes(v.id)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    
    const bar = document.getElementById('progress-bar');
    if(bar) {
        bar.style.width = percent + "%";
        bar.innerText = percent + "% Progress";
    }
}

document.getElementById('mark-complete-btn')?.addEventListener('click', () => {
    if (currentVideoId && !completedVideos.includes(currentVideoId)) {
        completedVideos.push(currentVideoId);
        localStorage.setItem('completedVideos', JSON.stringify(completedVideos));
        renderPlaylist();
    }
});

// ৯. কমেন্ট ও আলোচনা সিস্টেম
document.getElementById('post-comment-btn')?.addEventListener('click', async () => {
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
    if(!list) return;
    list.innerHTML = "Loading comments...";
    const q = query(collection(db, "Comments"), where("videoId", "==", currentVideoId), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    
    list.innerHTML = "";
    snap.forEach(doc => {
        const c = doc.data();
        list.innerHTML += `<div class="comment-item"><strong>${c.studentName}</strong>: ${c.text}</div>`;
    });
}

// ১০. ড্যাশবোর্ড ট্যাব সুইচিং লজিক
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.getAttribute('data-target');
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target)?.classList.add('active');
    });
});

// ১১. সার্টিফিকেট পিডিএফ জেনারেটর (jsPDF)
window.downloadCertificate = (courseName, studentName) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });

    doc.setDrawColor(212, 175, 55); 
    doc.setLineWidth(10);
    doc.rect(10, 10, 277, 190);

    doc.setFont("Helvetica", "bold");
    doc.setFontSize(38);
    doc.setTextColor(27, 67, 50); 
    doc.text("Certificate of Completion", 148, 60, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text("This is to certify that", 148, 90, { align: "center" });

    doc.setFontSize(28);
    doc.setTextColor(212, 175, 55); 
    doc.text(studentName, 148, 115, { align: "center" });

    doc.setFontSize(18);
    doc.setTextColor(0, 0, 0);
    doc.text(`has successfully completed the course`, 148, 140, { align: "center" });
    
    doc.text(`"${courseName}"`, 148, 155, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Issue Date: ${new Date().toLocaleDateString()}`, 148, 180, { align: "center" });

    doc.save(`${studentName}-${courseName}-Certificate.pdf`);
};

// ১২. লগআউট
document.getElementById('logout-btn')?.addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "login.html");
});