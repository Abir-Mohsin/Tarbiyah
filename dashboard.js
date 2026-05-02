/* 
   ================================================================
   TARBIYAH MASTER DASHBOARD SCRIPT
   সবগুলো ফিচার (Onboarding, Course, Quiz, Certificate) এখানে আছে।
   ================================================================
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, arrayUnion 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ১. ফায়ারবেস কনফিগারেশন (আপনার দেওয়া অরিজিনাল কী)
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

// --- গ্লোবাল ভেরিয়েবলসমূহ ---
let currentVideoId = "";
let currentCourseVideos = [];
let completedVideos = JSON.parse(localStorage.getItem('completedVideos')) || [];
let currentUserRef = null;

/* 
   ২. ইউজার লগইন স্টেট চেক (এই অংশটি ড্যাশবোর্ডের মেইন গেট)
   - ইউজার লগইন না থাকলে login.html এ পাঠাবে।
   - ইউজার নতুন হলে অনবোর্ডিং পপআপ দেখাবে।
*/
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(currentUserRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('student-name').innerText = userData.name || "Student";
            
            // যদি অনবোর্ডিং বাকি থাকে (নতুন ইউজার)
            if (userData.onboardingCompleted === false) {
                document.getElementById('onboarding-modal').classList.remove('hidden');
                initOnboarding(); // অনবোর্ডিং শুরু করো
            } else {
                // পুরাতন ইউজার হলে ড্যাশবোর্ড ডাটা লোড করো
                loadDashboardData(userData);
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

/* 
   ৩. অনবোর্ডিং সেকশন (কিওয়ার্ড সিলেকশন)
   ইউজার প্রথমবার আসার পর এই লজিকটি চলবে।
*/
function initOnboarding() {
    let selectedKeywords = [];
    document.querySelectorAll('.keyword-badge').forEach(badge => {
        badge.onclick = () => {
            const val = badge.getAttribute('data-val');
            if (selectedKeywords.includes(val)) {
                selectedKeywords = selectedKeywords.filter(k => k !== val);
                badge.classList.remove('selected');
            } else {
                selectedKeywords.push(val);
                badge.classList.add('selected');
            }
        };
    });

    document.getElementById('complete-onboarding-btn').onclick = async () => {
        const pic = document.getElementById('ob-profile-pic').value;
        if (selectedKeywords.length === 0) return alert("পছন্দের অন্তত একটি বিষয় সিলেক্ট করুন।");

        try {
            await updateDoc(currentUserRef, {
                profilePic: pic,
                interests: selectedKeywords,
                onboardingCompleted: true
            });
            location.reload(); // ডাটা আপডেট করে পেজ রিফ্রেশ
        } catch (e) { alert("সেভ করতে সমস্যা হয়েছে!"); }
    };
}

/* 
   ৪. ড্যাশবোর্ড ডাটা লোড (Stats, Course, Explore)
*/
async function loadDashboardData(userData) {
    // উপরের স্ট্যাটাস বক্স আপডেট
    document.getElementById('stat-courses').innerText = userData.myCourses ? userData.myCourses.length : 0;
    document.getElementById('stat-books').innerText = userData.myBooks ? userData.myBooks.length : 0;

    // ১. আপনার কেনা কোর্সগুলো দেখাও
    renderMyCourses(userData.myCourses || []);

    // ২. এক্সপ্লোর ট্যাবে আপনার পছন্দের কোর্সগুলো দেখাও
    renderExploreList(userData.interests || []);
}

// কেনা কোর্সের লিস্ট
function renderMyCourses(courses) {
    const listArea = document.getElementById('enrolled-courses-list');
    if (courses.length === 0) {
        listArea.innerHTML = "<p>এখনো কোনো কোর্স এনরোল করা হয়নি।</p>";
        return;
    }
    listArea.innerHTML = "";
    courses.forEach(cName => {
        listArea.innerHTML += `
            <div class="card">
                <h3>${cName}</h3>
                <button class="btn" onclick="startCourse('${cName}')">পড়াশোনা শুরু করুন</button>
            </div>`;
    });
}

// এক্সপ্লোর বা নতুন কোর্স সাজেস্ট করা
async function renderExploreList(userInterests) {
    const exploreList = document.getElementById('explore-courses-list');
    if(!exploreList) return;
    
    const snap = await getDocs(collection(db, "Courses"));
    exploreList.innerHTML = "";
    
    snap.forEach(doc => {
        const course = doc.data();
        const isRecommended = userInterests.includes(course.tag);
        exploreList.innerHTML += `
            <div class="card" style="${isRecommended ? 'border: 2px solid var(--soft-gold);' : ''}">
                ${isRecommended ? '<small style="color:var(--soft-gold)">আপনার পছন্দের বিষয়</small>' : ''}
                <img src="${course.image}" style="width:100%; height:150px; object-fit:cover; border-radius:10px;">
                <h3>${course.title}</h3>
                <p>দাম: ${course.price == 0 ? 'FREE' : course.price + ' BDT'}</p>
                <a href="admission.html" class="btn" style="margin-top:10px;">এনরোল করুন</a>
            </div>`;
    });
}

/* 
   ৫. ভিডিও প্লেয়ার সেকশন (Start Learning)
*/
window.startCourse = async (courseName) => {
    document.getElementById('course-selection').style.display = "none";
    document.getElementById('learning-area').classList.remove('hidden');
    document.getElementById('course-title').innerText = courseName;

    const q = query(collection(db, "Videos"), where("course", "==", courseName), orderBy("order", "asc"));
    const snap = await getDocs(q);
    
    currentCourseVideos = [];
    snap.forEach(doc => currentCourseVideos.push({ id: doc.id, ...doc.data() }));

    if (currentCourseVideos.length > 0) {
        updatePlaylist();
        loadVideo(currentCourseVideos[0]); // প্রথম ভিডিও প্লে করো
    } else {
        alert("এই কোর্সে কোনো ভিডিও পাওয়া যায়নি।");
    }
};

function updatePlaylist() {
    const list = document.getElementById('video-list');
    list.innerHTML = "";
    currentCourseVideos.forEach(v => {
        const isDone = completedVideos.includes(v.id) ? "✅" : "";
        const div = document.createElement('div');
        div.className = `playlist-item ${v.id === currentVideoId ? 'active' : ''}`;
        div.innerHTML = `<span>${v.title}</span> <span>${isDone}</span>`;
        div.onclick = () => loadVideo(v);
        list.appendChild(div);
    });
    updateProgressBar();
}

function loadVideo(v) {
    currentVideoId = v.id;
    document.getElementById('video-frame').src = v.url;
    updatePlaylist();
    loadComments();
}

function updateProgressBar() {
    const total = currentCourseVideos.length;
    const done = currentCourseVideos.filter(v => completedVideos.includes(v.id)).length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const bar = document.getElementById('progress-bar');
    if(bar) { bar.style.width = percent + "%"; bar.innerText = percent + "% সম্পন্ন"; }
}

document.getElementById('mark-complete-btn').onclick = async () => {
    if (currentVideoId && !completedVideos.includes(currentVideoId)) {
        completedVideos.push(currentVideoId);
        localStorage.setItem('completedVideos', JSON.stringify(completedVideos));
        
        // ডাটাবেসে প্রগ্রেস সেভ করো
        await updateDoc(currentUserRef, { completedLessons: completedVideos });
        updatePlaylist();
    }
};

/* 
   ৬. কুইজ এবং সার্টিফিকেট সেকশন
*/
async function loadQuizDashboard() {
    const area = document.getElementById('quiz-area');
    const userSnap = await getDoc(currentUserRef);
    const myCourses = userSnap.data().myCourses || [];

    if(myCourses.length === 0) { area.innerHTML = "আগে কোনো কোর্সে ভর্তি হন।"; return; }

    area.innerHTML = "<h4>কুইজ শুরু করতে কোর্স সিলেক্ট করুন:</h4><br>";
    myCourses.forEach(c => {
        area.innerHTML += `<button class="btn" style="margin:5px;" onclick="window.startExam('${c}')">${c} কুইজ দিন</button>`;
    });
}

window.startExam = async (courseTag) => {
    const area = document.getElementById('quiz-area');
    area.innerHTML = "লোড হচ্ছে...";
    const snap = await getDocs(query(collection(db, "Quizzes"), where("course", "==", courseTag)));
    
    if(snap.empty) { area.innerHTML = "এই কোর্সের জন্য কোনো কুইজ নেই।"; return; }

    let questions = [];
    let html = `<form id="exam-form">`;
    snap.forEach(doc => {
        const q = doc.data();
        questions.push({id: doc.id, ...q});
        html += `<div style="background:#f4f4f4; padding:15px; margin-bottom:10px; border-radius:10px;">
                    <p><strong>${q.question}</strong></p>
                    ${q.options.map(opt => `<label style="display:block;"><input type="radio" name="${doc.id}" value="${opt}" required> ${opt}</label>`).join('')}
                 </div>`;
    });
    html += `<button type="submit" class="btn">সাবমিট করুন</button></form>`;
    area.innerHTML = html;

    document.getElementById('exam-form').onsubmit = async (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        let correct = 0;
        questions.forEach(q => { if(data.get(q.id) === q.correctAnswer) correct++; });
        const score = Math.round((correct / questions.length) * 100);

        if(score >= 80) {
            alert(`মাশাআল্লাহ! আপনি ${score}% নম্বর পেয়ে পাস করেছেন। সার্টিফিকেট আনলক হয়েছে।`);
            await updateDoc(currentUserRef, { certificates: arrayUnion(courseTag) });
            loadCertificateDashboard();
        } else {
            alert(`আবার চেষ্টা করুন! আপনার স্কোর: ${score}%। পাসের জন্য ৮০% প্রয়োজন।`);
        }
    };
};

async function loadCertificateDashboard() {
    const area = document.getElementById('certificate-list');
    const userSnap = await getDoc(currentUserRef);
    const earned = userSnap.data().certificates || [];
    
    area.innerHTML = earned.length === 0 ? "আপনি এখনো কোনো সার্টিফিকেট পাননি।" : "";
    earned.forEach(cName => {
        area.innerHTML += `
            <div class="card cert-card">
                <i class="fas fa-award" style="font-size:3rem; color:gold;"></i>
                <h3>${cName}</h3>
                <button class="btn" onclick="downloadCertificate('${cName}', '${userSnap.data().name}')">ডাউনলোড PDF</button>
            </div>`;
    });
}

/* 
   ৭. ইউটিলিটি ফাংশনসমূহ (PDF, Tabs, Logout)
*/
window.downloadCertificate = (course, name) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setDrawColor(212, 175, 55); doc.setLineWidth(10); doc.rect(10, 10, 277, 190);
    doc.setFontSize(40); doc.text("Certificate of Completion", 148, 60, {align: "center"});
    doc.setFontSize(30); doc.text(name, 148, 110, {align: "center"});
    doc.setFontSize(20); doc.text(`Completed Course: ${course}`, 148, 150, {align: "center"});
    doc.save(`${name}-Certificate.pdf`);
};

// ট্যাব সুইচিং
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.onclick = () => {
        const target = tab.getAttribute('data-target');
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));
        document.getElementById(target)?.classList.add('active');
        
        if(target === 'tab-quiz') loadQuizDashboard();
        if(target === 'tab-certificates') loadCertificateDashboard();
    };
});

// লগআউট
document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "login.html");

// ভিডিও কমেন্ট লোড করার লজিক (সংক্ষেপিত)
async function loadComments() {
    const list = document.getElementById('comments-list');
    if(!list) return;
    const q = query(collection(db, "Comments"), where("videoId", "==", currentVideoId), orderBy("timestamp", "desc"));
    const snap = await getDocs(q);
    list.innerHTML = "";
    snap.forEach(doc => {
        const c = doc.data();
        list.innerHTML += `<div class="comment-item"><strong>${c.studentName}</strong>: ${c.text}</div>`;
    });
}

document.getElementById('post-comment-btn').onclick = async () => {
    const text = document.getElementById('comment-input').value;
    if(!text || !currentVideoId) return;
    await addDoc(collection(db, "Comments"), {
        videoId: currentVideoId, text: text,
        studentName: document.getElementById('student-name').innerText,
        timestamp: new Date()
    });
    document.getElementById('comment-input').value = "";
    loadComments();
};

// লার্নিং রিপোর্ট গ্রাফ তৈরি (Chart.js)
function renderProgressChart(completedCount, totalCount) {
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    if(!ctx) return;

    // যদি আগে কোনো চার্ট থাকে তা ধ্বংস করে নতুনটা বানাবে
    if(window.myChart) window.myChart.destroy();

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'Remaining'],
            datasets: [{
                data: [completedCount, totalCount - completedCount],
                backgroundColor: ['#D4AF37', '#eee'],
                borderWidth: 0
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'bottom' }
            }
        }
    });
}

// আপনার loadStudentDashboard ফাংশনের ভেতর এটি কল করুন:
// renderProgressChart(userData.completedLessons?.length || 0, 10); // ১০ এর জায়গায় আপনার মোট লেসন সংখ্যা হবে