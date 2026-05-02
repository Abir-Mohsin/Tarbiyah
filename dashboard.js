/* 
   ========================================================
   Tarbiyah Master Dashboard Script (dashboard.js)
   Features: Onboarding, Tabs, Video Player, Quiz, 
   Certificates, Live Classes & Progress.
   ========================================================
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, doc, getDoc, collection, query, where, orderBy, getDocs, addDoc, updateDoc, arrayUnion 
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

// ২. অথেনটিকেশন এবং মেইন লোডার
onAuthStateChanged(auth, async (user) => {
    if (user) {
        currentUserRef = doc(db, "Users", user.uid);
        const userDoc = await getDoc(currentUserRef);
        
        if (userDoc.exists()) {
            const userData = userDoc.data();
            document.getElementById('student-name').innerText = userData.name || "Student";
            
            if (userData.onboardingCompleted === false) {
                document.getElementById('onboarding-modal').classList.remove('hidden');
                setupOnboarding();
            } else {
                loadStudentDashboard(userData);
                // onAuthStateChanged এর ভেতরে userData পাওয়ার পর এটি যোগ করুন
if (userData.profilePic) {
    const headerPic = document.getElementById('header-user-pic');
    if (headerPic) headerPic.src = userData.profilePic;
}
// পেজ লোড হওয়ার সাথে সাথেই প্রোফাইল সেকশন রেডি করে রাখা
setupProfileManagement(userData);
                loadLiveClasses(userData);
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

// ৩. ট্যাব সুইচিং লজিক (Updated with Report & Profile)
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', async () => { // async যোগ করা হয়েছে ডাটা আনার জন্য
        const target = tab.getAttribute('data-target');

        // সব ট্যাব থেকে active ক্লাস সরানো
        document.querySelectorAll('.dash-tab').forEach(t => t.classList.remove('active'));
        // সব সেকশন হাইড করা
        document.querySelectorAll('.dash-section').forEach(s => s.classList.remove('active'));

        // ক্লিক করা ট্যাব এবং সেকশনকে একটিভ করা
        tab.classList.add('active');
        const activeSection = document.getElementById(target);
        if (activeSection) activeSection.classList.add('active');

        // --- নির্দিষ্ট ট্যাবের জন্য ডাটা লোড করা ---
        
        // ১. কুইজ ড্যাশবোর্ড
        if (target === 'tab-quiz') loadQuizDashboard();
        
        // ২. সার্টিফিকেট ড্যাশবোর্ড
        if (target === 'tab-certificates') loadCertificateDashboard();
        
        // ৩. এক্সপ্লোর বা নতুন কোর্স
        if (target === 'tab-explore') {
             const docSnap = await getDoc(currentUserRef);
             loadExploreCourses(docSnap.data().interests || []);
        }

        // ৪. লার্নিং রিপোর্ট (নতুন যুক্ত হলো)
        if (target === 'tab-report') {
            const docSnap = await getDoc(currentUserRef);
            loadLearningReport(docSnap.data()); // এটি গ্রাফ লোড করবে
        }

        // ৫. প্রোফাইল ম্যানেজমেন্ট (নতুন যুক্ত হলো)
        if (target === 'tab-profile') {
            const docSnap = await getDoc(currentUserRef);
            setupProfileManagement(docSnap.data()); // এটি প্রোফাইল ফর্ম সেটআপ করবে
        }
    });
});

// ৪. স্টুডেন্ট ড্যাশবোর্ড ডাটা (Stats)
async function loadStudentDashboard(userData) {
    document.getElementById('stat-courses').innerText = userData.myCourses ? userData.myCourses.length : 0;
    document.getElementById('stat-books').innerText = userData.myBooks ? userData.myBooks.length : 0;
    renderEnrolledCourses(userData.myCourses || []);
    // dashboard.js এর ভেতরে renderMyBooks নামে নতুন ফাংশন
async function renderMyBooks(bookList) {
    const booksArea = document.getElementById('tab-report'); // আপাতত রিপোর্টের নিচে বা আলাদা ট্যাবে দিতে পারেন
    // যদি আপনি আলাদা ট্যাব 'tab-books' বানিয়ে থাকেন তবে সেখানে দিবেন।
    
    if (!bookList || bookList.length === 0) return;
    
    let html = `<h3>My Library (Enrolled Books)</h3><div class="grid">`;
    
    // ফায়ারস্টোর থেকে বইয়ের লিঙ্কগুলো আনতে হবে
    const snap = await getDocs(collection(db, "Books"));
    snap.forEach(doc => {
        const b = doc.data();
        if (bookList.includes(b.title)) {
            html += `
                <div class="card">
                    <img src="${b.image}" width="100">
                    <h3>${b.title}</h3>
                    <button class="btn" onclick="window.openPdfReader('${b.title}', '${b.pdf}')">Read Now</button>
                </div>`;
        }
    });
    html += `</div><br><hr><br>`;
    
    // এটি ড্যাশবোর্ডের শুরুতে যোগ করে দিবে
    const learningTab = document.getElementById('tab-learning');
    learningTab.insertAdjacentHTML('afterbegin', html);
}

// loadStudentDashboard ফাংশনের ভেতরে এটি কল করুন:
// renderMyBooks(userData.myBooks || []);
}

// ৫. কেনা কোর্সের তালিকা রেন্ডার
function renderEnrolledCourses(courses) {
    const listArea = document.getElementById('enrolled-courses-list');
    if (!listArea) return;
    if (courses.length === 0) {
        listArea.innerHTML = "<p>You haven't enrolled in any courses yet.</p>";
        return;
    }
    listArea.innerHTML = "";
    courses.forEach(courseName => {
        listArea.innerHTML += `
            <div class="card">
                <h3>${courseName}</h3>
                <button class="btn" onclick="startCourse('${courseName}')" style="margin-top:10px;">Continue Lesson</button>
            </div>`;
    });
}

// ৬. ভিডিও প্লেয়ার লজিক
window.startCourse = async (courseName) => {
    document.getElementById('enrolled-courses-list').parentElement.classList.add('hidden');
    document.getElementById('learning-area').classList.remove('hidden');
    document.getElementById('course-title').innerText = courseName;

    const q = query(collection(db, "Videos"), where("course", "==", courseName), orderBy("order", "asc"));
    const snap = await getDocs(q);
    currentCourseVideos = [];
    snap.forEach(doc => currentCourseVideos.push({ id: doc.id, ...doc.data() }));

    if (currentCourseVideos.length > 0) {
        renderPlaylist();
        playVideo(currentCourseVideos[0]);
    } else {
        alert("No lessons found.");
    }
};

function renderPlaylist() {
    const list = document.getElementById('video-list');
    list.innerHTML = "";
    currentCourseVideos.forEach(v => {
        const isDone = completedVideos.includes(v.id) ? "✅" : "";
        const div = document.createElement('div');
        div.className = `playlist-item ${v.id === currentVideoId ? 'active' : ''}`;
        div.innerHTML = `<span>${v.title}</span> <span>${isDone}</span>`;
        div.onclick = () => playVideo(v);
        list.appendChild(div);
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
    if (bar) { bar.style.width = percent + "%"; bar.innerText = percent + "% Progress"; }
}

document.getElementById('mark-complete-btn')?.addEventListener('click', async () => {
    if (currentVideoId && !completedVideos.includes(currentVideoId)) {
        completedVideos.push(currentVideoId);
        localStorage.setItem('completedVideos', JSON.stringify(completedVideos));
        await updateDoc(currentUserRef, { completedLessons: completedVideos });
        renderPlaylist();
    }
});

// ৭. কুইজ ড্যাশবোর্ড লজিক
async function loadQuizDashboard() {
    const quizArea = document.getElementById('quiz-area');
    quizArea.innerHTML = "Loading...";
    const userDoc = await getDoc(currentUserRef);
    const myCourses = userDoc.data().myCourses || [];

    if (myCourses.length === 0) {
        quizArea.innerHTML = "<p>Enroll in a course first.</p>";
        return;
    }

    quizArea.innerHTML = "<h4>Select course for Exam:</h4><br>";
    myCourses.forEach(c => {
        const btn = document.createElement('button');
        btn.className = "btn"; btn.style.margin = "5px";
        btn.innerText = `Start ${c} Quiz`;
        btn.onclick = () => runExam(c);
        quizArea.appendChild(btn);
    });
}

async function runExam(courseTag) {
    const quizArea = document.getElementById('quiz-area');
    const q = query(collection(db, "Quizzes"), where("course", "==", courseTag));
    const snap = await getDocs(q);

    if (snap.empty) { quizArea.innerHTML = "No quiz for this course."; return; }

    let questions = [];
    let html = `<form id="active-quiz">`;
    snap.forEach(doc => {
        const data = doc.data();
        questions.push({ id: doc.id, ...data });
        html += `<div class="admin-card" style="margin-bottom:10px;">
            <p><strong>${data.question}</strong></p>
            ${data.options.map(o => `<label style="display:block;"><input type="radio" name="${doc.id}" value="${o}" required> ${o}</label>`).join('')}
        </div>`;
    });
    html += `<button type="submit" class="btn">Submit</button></form>`;
    quizArea.innerHTML = html;

    document.getElementById('active-quiz').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        let correct = 0;
        questions.forEach(q => { if (fd.get(q.id) === q.correctAnswer) correct++; });
        const score = Math.round((correct / questions.length) * 100);

        if (score >= 80) {
            alert("Passed! Certificate Unlocked.");
            await updateDoc(currentUserRef, { certificates: arrayUnion(courseTag) });
            loadCertificateDashboard();
        } else {
            alert(`Score: ${score}%. Need 80% to pass.`);
        }
    };
}

// ৮. সার্টিফিকেট ড্যাশবোর্ড লজিক
async function loadCertificateDashboard() {
    const certArea = document.getElementById('certificate-list');
    certArea.innerHTML = "Loading...";
    const userDoc = await getDoc(currentUserRef);
    const earned = userDoc.data().certificates || [];

    certArea.innerHTML = earned.length === 0 ? "No certificates earned yet." : "";
    earned.forEach(cName => {
        certArea.innerHTML += `
            <div class="card cert-card">
                <i class="fas fa-award" style="font-size:3rem; color:gold;"></i>
                <h3>${cName}</h3>
                <button class="btn" onclick="downloadCertificate('${cName}', '${userDoc.data().name}')">Download PDF</button>
            </div>`;
    });
}

// ৯. সার্টিফিকেট PDF জেনারেটর
window.downloadCertificate = (course, name) => {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setDrawColor(212, 175, 55); doc.setLineWidth(10); doc.rect(10, 10, 277, 190);
    doc.setFontSize(40); doc.text("Certificate of Completion", 148, 60, {align: "center"});
    doc.setFontSize(30); doc.text(name, 148, 110, {align: "center"});
    doc.setFontSize(20); doc.text(`Course: ${course}`, 148, 150, {align: "center"});
    doc.save(`${name}-Certificate.pdf`);
};

// ১০. অন্যান্য ফাংশন (Explore, Comments, Logout, Onboarding)
async function loadExploreCourses(userInterests) {
    const exploreList = document.getElementById('explore-courses-list');
    const snap = await getDocs(collection(db, "Courses"));
    exploreList.innerHTML = "";
    snap.forEach(doc => {
        const c = doc.data();
        const isRec = userInterests.includes(c.tag);
        exploreList.innerHTML += `
            <div class="card" style="${isRec ? 'border:2px solid gold' : ''}">
                <img src="${c.image}" style="width:100%; height:150px; object-fit:cover; border-radius:10px;">
                <h3>${c.title}</h3>
                <a href="admission.html" class="btn">Enroll</a>
            </div>`;
    });
}

// ৭. লাইভ ক্লাস লোডার (কাউন্টডাউন টাইমার সহ)
async function loadLiveClasses(userData) {
    const liveArea = document.getElementById('tab-live');
    if(!liveArea) return;

    try {
        const q = query(collection(db, "LiveClasses"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        
        let html = `<h3>Upcoming Live Sessions</h3><br><div class="grid">`;
        let hasClass = false;

        snap.forEach(doc => {
            const data = doc.data();
            if (data.targetCourse === "All" || (userData.myCourses && userData.myCourses.includes(data.targetCourse))) {
                hasClass = true;
                
                // ডেট এবং টাইম মিলিয়ে টার্গেট সময় বের করা (কাউন্টডাউনের জন্য)
                const targetDateTime = new Date(`${data.date}T${data.time}`).getTime();
                const timerId = `timer-${doc.id}`;

                html += `
                    <div class="card" style="border-left: 4px solid red; text-align: left;">
                        <span style="background: red; color: white; padding: 3px 8px; border-radius: 5px; font-size: 0.8rem; font-weight: bold;">● LIVE CLASS</span>
                        <h3 style="margin-top: 15px;">${data.title}</h3>
                        <p style="color: #555; margin-bottom: 10px;">Scheduled for: ${data.date} at ${data.time}</p>
                        
                        <!-- টাইমার দেখানোর জায়গা -->
                        <div style="background: #f4f4f4; padding: 10px; border-radius: 5px; text-align: center; margin-bottom: 15px;">
                            <strong style="color: var(--primary-green); font-size: 1.2rem;" id="${timerId}">Loading timer...</strong>
                        </div>
                        
                        <a href="${data.link}" target="_blank" class="btn" style="width: 100%;">Join Class Now</a>
                    </div>`;

                // টাইমার চালু করার ফাংশন
                startCountdown(targetDateTime, timerId);
            }
        });
        html += `</div>`;
        if (hasClass) liveArea.innerHTML = html;
    } catch (e) { console.log("Live class error"); }
}

// কাউন্টডাউন টাইমার ফাংশন (dashboard.js এর যেকোনো জায়গায় রাখুন)
function startCountdown(targetTime, elementId) {
    const x = setInterval(function() {
        const now = new Date().getTime();
        const distance = targetTime - now;

        if (distance < 0) {
            clearInterval(x);
            const el = document.getElementById(elementId);
            if(el) el.innerHTML = "<span style='color:red;'>Class is LIVE right now!</span>";
            return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        const el = document.getElementById(elementId);
        if(el) el.innerHTML = `${days}d ${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

function setupOnboarding() {
    let selected = [];
    document.querySelectorAll('.keyword-badge').forEach(b => {
        b.onclick = () => {
            const v = b.getAttribute('data-val');
            if(selected.includes(v)) selected = selected.filter(i => i !== v);
            else selected.push(v);
            b.classList.toggle('selected');
        };
    });
    document.getElementById('complete-onboarding-btn').onclick = async () => {
        await updateDoc(currentUserRef, { onboardingCompleted: true, interests: selected });
        location.reload();
    };
}

document.getElementById('logout-btn').onclick = () => signOut(auth).then(() => window.location.href = "login.html");

// --- ১১. লার্নিং রিপোর্ট গ্রাফ (Chart.js) ---
function renderProgressChart(completedCount, totalCount) {
    const ctx = document.getElementById('progressChart')?.getContext('2d');
    if (!ctx) return;

    // যদি আগে কোনো চার্ট থাকে তা ধ্বংস করে নতুনটা বানাবে
    if (window.myChart instanceof Chart) {
        window.myChart.destroy();
    }

    const remaining = totalCount - completedCount;
    const percentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    window.myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed Lessons', 'Remaining'],
            datasets: [{
                data: [completedCount, remaining > 0 ? remaining : 0],
                backgroundColor: ['#D4AF37', '#e0e0e0'],
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

    document.getElementById('report-text').innerText = `You have completed ${percentage}% of your enrolled lessons!`;
}

// রিপোর্ট ডাটা ক্যালকুলেট করার ফাংশন
async function loadLearningReport(userData) {
    const completedCount = userData.completedLessons ? userData.completedLessons.length : 0;
    
    // সব কোর্সের মোট ভিডিও সংখ্যা বের করা (সিম্পল লজিক)
    // প্রফেশনাল করতে হলে সব কোর্সের ভিডিও কোয়েরি করে যোগ করতে হবে। 
    // আপাতত আমরা স্টুডেন্টের কেনা কোর্সের ওপর ভিত্তি করে একটি আনুমানিক সংখ্যা দিচ্ছি।
    const totalVideosPossible = (userData.myCourses ? userData.myCourses.length : 0) * 5; // প্রতি কোর্সে ৫টি ভিডিও ধরছি
    
    renderProgressChart(completedCount, totalVideosPossible || 1);
}


// --- ১২. প্রোফাইল ম্যানেজমেন্ট লজিক (উন্নত ও ফিক্সড) ---
function setupProfileManagement(userData) {
    const nameInp = document.getElementById('p-name');
    const phoneInp = document.getElementById('p-phone');
    const imgInp = document.getElementById('p-img');
    const updateBtn = document.getElementById('update-profile-btn');

    // ইনপুট ফিল্ডগুলোতে ডাটা বসানো
    if(nameInp) nameInp.value = userData.name || "";
    if(phoneInp) phoneInp.value = userData.phone || "";
    if(imgInp) imgInp.value = userData.profilePic || "";

    // বাটন ক্লিক লজিক
    if (updateBtn) {
        // আগের কোনো ইভেন্ট লিসেনার থাকলে তা সরিয়ে নতুনটা দেওয়া (Duplicate এড়াতে)
        updateBtn.onclick = async (e) => {
            e.preventDefault();
            
            const newName = nameInp.value.trim();
            const newPhone = phoneInp.value.trim();
            const newImg = imgInp.value.trim();

            if (!newName) return alert("Name cannot be empty!");

            updateBtn.innerText = "Updating...";
            updateBtn.disabled = true;

            try {
                // ডাটাবেস আপডেট
                await updateDoc(currentUserRef, {
                    name: newName,
                    phone: newPhone,
                    profilePic: newImg
                });

                // হেডারের ছবি সাথে সাথে আপডেট করা
                const headerPic = document.getElementById('header-user-pic');
                if (headerPic && newImg) headerPic.src = newImg;
                
                // স্টুডেন্টের নাম ড্যাশবোর্ডে আপডেট করা
                const dashName = document.getElementById('student-name');
                if (dashName) dashName.innerText = newName;

                alert("MashaAllah! Profile updated successfully.");
            } catch (error) {
                console.error("Update Error:", error);
                alert("Failed to update profile. Please check console.");
            } finally {
                updateBtn.innerText = "Update Profile";
                updateBtn.disabled = false;
            }
        };
    }
}

// --- ১৩. মেইন ট্যাব সুইচিং লজিক আপডেট (আগেরটার সাথে মিলিয়ে নিন) ---
// নিশ্চিত করুন ট্যাব লজিকে Report এবং Profile এর কলগুলো আছে:
document.querySelectorAll('.dash-tab').forEach(tab => {
    tab.addEventListener('click', async () => {
        const target = tab.getAttribute('data-target');
        // ... (আগের কোড) ...
        
        if (target === 'tab-report' || target === 'tab-profile') {
            const userSnap = await getDoc(currentUserRef);
            if(target === 'tab-report') loadLearningReport(userSnap.data());
            if(target === 'tab-profile') setupProfileManagement(userSnap.data());
        }
    });
});

// উন্নত PDF Reader ফাংশন (Fix for Loading Issue)
window.openPdfReader = (title, pdfUrl) => {
    let embedUrl = pdfUrl;
    
    // গুগল ড্রাইভ লিঙ্ক চেক এবং কনভার্ট করা
    if (pdfUrl.includes("drive.google.com")) {
        try {
            let fileId = "";
            if (pdfUrl.includes("/d/")) {
                fileId = pdfUrl.split("/d/")[1].split("/")[0];
            } else if (pdfUrl.includes("id=")) {
                fileId = pdfUrl.split("id=")[1].split("&")[0];
            }
            
            if (fileId) {
                // এটি গুগল ড্রাইভের অফিশিয়াল প্রিভিউ লিঙ্ক
                embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
            }
        } catch (e) {
            console.error("Link conversion error:", e);
        }
    }

    const iframe = document.getElementById('pdf-iframe');
    const titleEl = document.getElementById('pdf-reader-title');
    const modal = document.getElementById('pdf-reader-modal');

    if (iframe && modal) {
        titleEl.innerText = title;
        iframe.src = embedUrl; // এখানে লিঙ্কটি বসানো হচ্ছে
        modal.classList.remove('hidden');
        document.body.style.overflow = "hidden"; // পেজ স্ক্রল বন্ধ

        // একটি ছোট সতর্কতা: যদি অনেকক্ষণ লোড না হয়
        iframe.onerror = function() {
            alert("This PDF could not be loaded in the reader. Please make sure the Drive link is set to 'Public'.");
        };
    }
};