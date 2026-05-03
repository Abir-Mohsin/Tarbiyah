/* 
   Tarbiyah Admin Master Script (Final Merged Version)
   Features: Sidebar, Theming, Rich Text Editor, LMS Control, Users.
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, updateDoc, setDoc, doc, deleteDoc, getDoc, arrayUnion, query, orderBy 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ২. অ্যাডমিন লগইন লজিক
const loginBtn = document.getElementById('login-btn');
const passwordInput = document.getElementById('admin-pass');
const loginSection = document.getElementById('login-section');
const adminWrapper = document.getElementById('admin-dashboard-wrapper');
const ADMIN_PASSWORD = "admin123"; 

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginSection.classList.add('hidden');
            if(adminWrapper) adminWrapper.classList.remove('hidden');
            loadAdmissions();
        } else {
            document.getElementById('error-msg').style.display = 'block';
        }
    });
}

// ৩. সাইডবার লজিক (ট্যাব সুইচিং)
window.showSection = function(id) {
    document.querySelectorAll('.admin-card').forEach(card => card.classList.add('hidden'));
    document.querySelectorAll('.sidebar-links li').forEach(li => li.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');

    const tabId = "tab-" + id.replace('-view', '');
    const activeTab = document.getElementById(tabId);
    if(activeTab) activeTab.classList.add('active');
}

// সাইডবার ইভেন্ট লিসেনারস
document.getElementById('tab-admissions')?.addEventListener('click', () => { showSection('admissions-view'); loadAdmissions(); });
document.getElementById('tab-users')?.addEventListener('click', () => { showSection('users-view'); loadUsers(); });
document.getElementById('tab-manage-courses')?.addEventListener('click', () => showSection('manage-courses-view'));
document.getElementById('tab-add-video')?.addEventListener('click', () => showSection('add-video-view'));
document.getElementById('tab-manage-teachers')?.addEventListener('click', () => { showSection('manage-teachers-view'); loadTeachers(); });
document.getElementById('tab-manage-blogs')?.addEventListener('click', () => { showSection('manage-blogs-view'); loadBlogs(); });
document.getElementById('tab-theme-settings')?.addEventListener('click', () => showSection('theme-settings-view'));
document.getElementById('tab-messages')?.addEventListener('click', () => { showSection('messages-view'); loadMessages(); });

// ৪. Quill.js Rich Text Editor চালু করা (ব্লগের জন্য)
let quill;
if (document.getElementById('quill-editor')) {
    quill = new Quill('#quill-editor', {
        theme: 'snow',
        modules: {
            toolbar:[
                [{ 'header': [1, 2, 3, false] }],['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],[{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'image', 'video'],
                ['clean']
            ]
        },
        placeholder: 'Write your beautiful article here...'
    });
}


// ৫. ডাটা লোড করার ফাংশনসমূহ
async function loadAdmissions() {
    const tbody = document.querySelector('#admissions-table tbody');
    if(!tbody) return;
    const snap = await getDocs(collection(db, "Admissions"));
    tbody.innerHTML = '';
    snap.forEach(doc => {
        const d = doc.data();
        tbody.innerHTML += `<tr><td>${d.name}</td><td>${d.email}</td><td>${d.course}</td><td>${d.trxId}</td></tr>`;
    });
}

async function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    if(!tbody) return;
    const snap = await getDocs(collection(db, "Users"));
    tbody.innerHTML = '';
    snap.forEach(userDoc => {
        const u = userDoc.data();
        const courses = u.myCourses ? u.myCourses.join(", ") : "None";
        tbody.innerHTML += `<tr><td>${u.name}</td><td>${u.email}</td><td>${courses}</td><td><button class="btn" onclick="openAssignModal('${userDoc.id}')" style="padding:5px;">Assign Course</button></td></tr>`;
    });
}

async function loadBlogs() {
    const tbody = document.getElementById('blogs-table-body');
    if(!tbody) return;
    const q = query(collection(db, "Blogs"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    tbody.innerHTML = '';
    snap.forEach(bDoc => {
        const b = bDoc.data();
        tbody.innerHTML += `<tr><td>${b.title}</td><td><img src="${b.image}" width="50" style="border-radius:5px;"></td><td>
            <button class="btn" onclick="editBlog('${bDoc.id}')" style="padding:5px;">Edit</button>
            <button class="btn" onclick="deleteBlog('${bDoc.id}')" style="padding:5px; background:red;">Delete</button>
        </td></tr>`;
    });
}

async function loadTeachers() {
    const tbody = document.getElementById('teachers-table-body');
    if(!tbody) return;
    const snap = await getDocs(collection(db, "Teachers"));
    tbody.innerHTML = '';
    snap.forEach(tDoc => {
        const t = tDoc.data();
        tbody.innerHTML += `<tr><td>${t.name}</td><td>${t.subject}</td><td>
            <button class="btn" onclick="editTeacher('${tDoc.id}')" style="padding:5px;">Edit</button>
            <button class="btn" onclick="deleteTeacher('${tDoc.id}')" style="padding:5px; background:red;">Delete</button>
        </td></tr>`;
    });
}

async function loadMessages() {
    const tbody = document.querySelector('#messages-table tbody');
    if(!tbody) return;
    
    tbody.innerHTML = '<tr><td colspan="3">Loading messages...</td></tr>';
    
    try {
        // Contacts কালেকশন থেকে ডাটা আনবে
        const snap = await getDocs(collection(db, "Contacts"));
        tbody.innerHTML = '';
        
        if(snap.empty) {
            tbody.innerHTML = '<tr><td colspan="3">No messages found.</td></tr>';
            return;
        }

        snap.forEach(doc => {
            const data = doc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${data.name}</td>
                    <td>${data.email}</td>
                    <td>${data.message}</td>
                </tr>`;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Error loading messages!</td></tr>';
    }
}


// ৬. ফর্ম সাবমিশন লজিকসমূহ

// ব্লগ সেভ (Rich Text Editor সহ)
const bForm = document.getElementById('blog-upload-form');
bForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-blog-id').value;
    const richContent = quill.root.innerHTML;

    if (richContent === "<p><br></p>") return alert("Content cannot be empty!");

    const data = { 
        title: document.getElementById('b-title').value, 
        image: document.getElementById('b-img').value, 
        content: richContent, 
        createdAt: new Date() 
    };

    try {
        if (editId) await updateDoc(doc(db, "Blogs", editId), data);
        else await addDoc(collection(db, "Blogs"), data);
        alert("Blog Article Saved!"); 
        bForm.reset(); 
        quill.root.innerHTML = ""; 
        document.getElementById('edit-blog-id').value = ""; 
        loadBlogs();
    } catch(err) { alert("Error saving blog!"); }
});

// থিম সেটিংস সেভ
const themeForm = document.getElementById('theme-settings-form');
themeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await setDoc(doc(db, "Settings", "theme"), {
            siteName: document.getElementById('s-name').value || "Tarbiyah",
            logoImg: document.getElementById('s-logo-img').value || "",
            primaryColor: document.getElementById('s-primary-color').value || "#1B4332",
            accentColor: document.getElementById('s-accent-color').value || "#D4AF37",
            fontUrl: document.getElementById('s-font-url').value || ""
        });
        alert("MashaAllah! Theme and Branding Updated.");
    } catch (e) { alert("Theme update failed!"); }
});

// টিচার সেভ
const tForm = document.getElementById('teacher-upload-form');
tForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-teacher-id').value;
    const data = { name: document.getElementById('t-name').value, subject: document.getElementById('t-subject').value, image: document.getElementById('t-img').value, bio: document.getElementById('t-bio').value };
    if (editId) await updateDoc(doc(db, "Teachers", editId), data);
    else await addDoc(collection(db, "Teachers"), data);
    alert("Teacher Saved!"); tForm.reset(); document.getElementById('edit-teacher-id').value = ""; loadTeachers();
});

// ভিডিও সেভ
document.getElementById('video-upload-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "Videos"), { title: document.getElementById('v-title').value, url: `https://www.youtube.com/embed/${document.getElementById('v-url').value}`, course: document.getElementById('v-course').value, order: parseInt(document.getElementById('v-order').value) });
    alert("Video Added!"); e.target.reset();
});

// কোর্স কার্ড সেভ
document.getElementById('course-create-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "Courses"), { title: document.getElementById('c-title').value, tag: document.getElementById('c-tag').value, image: document.getElementById('c-img').value, price: document.getElementById('c-price').value, description: document.getElementById('c-desc').value, createdAt: new Date() });
    alert("Course Published!"); e.target.reset();
});


// ৭. গ্লোবাল উইন্ডো ফাংশনসমূহ (টেবিল থেকে কল করার জন্য)

window.editBlog = async (id) => {
    const snap = await getDoc(doc(db, "Blogs", id));
    const b = snap.data();
    document.getElementById('b-title').value = b.title;
    document.getElementById('b-img').value = b.image;
    quill.root.innerHTML = b.content; // এডিটরে কন্টেন্ট বসানো
    document.getElementById('edit-blog-id').value = id;
    window.scrollTo(0,0);
};

window.deleteBlog = async (id) => {
    if(confirm("Delete blog?")) { await deleteDoc(doc(db, "Blogs", id)); loadBlogs(); }
};

window.editTeacher = async (id) => {
    const snap = await getDoc(doc(db, "Teachers", id));
    const t = snap.data();
    document.getElementById('t-name').value = t.name;
    document.getElementById('t-subject').value = t.subject;
    document.getElementById('t-img').value = t.image;
    document.getElementById('t-bio').value = t.bio;
    document.getElementById('edit-teacher-id').value = id;
    window.scrollTo(0,0);
};

window.deleteTeacher = async (id) => {
    if(confirm("Delete teacher?")) { await deleteDoc(doc(db, "Teachers", id)); loadTeachers(); }
};

window.openAssignModal = (uid) => {
    window.selectedUserUid = uid;
    document.getElementById('course-modal').classList.remove('hidden');
    // admin.js এর কনফার্ম বাটন লজিক:
document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const assignType = document.getElementById('assign-type').value; // নতুন আইডি
    const itemName = document.getElementById('select-course').value; // কোর্স বা বইয়ের নাম
    
    if (window.selectedUserUid) {
        const userRef = doc(db, "Users", window.selectedUserUid);
        const updateData = {};
        
        if (assignType === 'course') {
            updateData.myCourses = arrayUnion(itemName);
        } else {
            updateData.myBooks = arrayUnion(itemName); // ইউজারের প্রোফাইলে বই যোগ হবে
        }
        
        updateData.status = "Active";
        await updateDoc(userRef, updateData);
        alert("Success! Access granted.");
        document.getElementById('course-modal').classList.add('hidden');
    }
});
};

document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const courseName = document.getElementById('select-course').value;
    if (window.selectedUserUid) {
        await updateDoc(doc(db, "Users", window.selectedUserUid), { myCourses: arrayUnion(courseName), status: "Active" });
        alert("Assigned!"); document.getElementById('course-modal').classList.add('hidden'); loadUsers();
    }
});

// বই আপলোড এবং লিস্ট লোড করার লজিক
document.getElementById('tab-manage-books')?.addEventListener('click', () => { 
    showSection('manage-books-view'); 
    loadBooks(); 
});

const bookForm = document.getElementById('book-upload-form');
bookForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "Books"), {
            title: document.getElementById('bk-title').value,
            author: document.getElementById('bk-author').value,
            image: document.getElementById('bk-img').value,
            pdf: document.getElementById('bk-pdf').value,
            price: document.getElementById('bk-price').value,
            description: document.getElementById('bk-desc').value,
            createdAt: new Date()
        });
        alert("Book Added!"); bookForm.reset(); loadBooks();
    } catch (e) { alert("Error!"); }
});

async function loadBooks() {
    const tbody = document.getElementById('books-table-body');
    if(!tbody) return;
    const snap = await getDocs(collection(db, "Books"));
    tbody.innerHTML = '';
    snap.forEach(doc => {
        const b = doc.data();
        tbody.innerHTML += `<tr><td>${b.title}</td><td>${b.price}</td><td><button onclick="deleteDocById('Books', '${doc.id}')" class="btn" style="background:red; padding:5px;">Delete</button></td></tr>`;
    });
}

// --- Research Management Logic ---

// ১. ট্যাব ক্লিক করলে রিসার্চ সেকশন ও ডাটা লোড হবে
document.getElementById('tab-manage-research')?.addEventListener('click', () => { 
    showSection('manage-research-view'); 
    loadResearch(); 
});

// ২. রিসার্চ পেপার সেভ করার লজিক
const resForm = document.getElementById('research-upload-form');
resForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "Research"), {
            title: document.getElementById('res-title').value,
            link: document.getElementById('res-link').value,
            category: document.getElementById('res-category').value,
            createdAt: new Date()
        });
        alert("Research Paper Added!");
        resForm.reset();
        loadResearch(); // টেবিল আপডেট করবে
    } catch (e) {
        alert("Error adding research paper!");
    }
});

// ৩. রিসার্চ লিস্ট লোড করার ফাংশন
async function loadResearch() {
    const tbody = document.getElementById('research-table-body');
    if(!tbody) return;
    
    const snap = await getDocs(collection(db, "Research"));
    tbody.innerHTML = '';
    
    snap.forEach(doc => {
        const r = doc.data();
        tbody.innerHTML += `
            <tr>
                <td>${r.title}</td>
                <td>${r.category || 'General'}</td>
                <td>
                    <button onclick="deleteDocById('Research', '${doc.id}')" class="btn" style="background:red; padding:5px;">Delete</button>
                </td>
            </tr>`;
    });
}

// ৪. ডিলিট করার জন্য একটি কমন ফাংশন (যদি আগে না থাকে)
window.deleteDocById = async (collectionName, id) => {
    if(confirm("Are you sure you want to delete this?")) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            alert("Deleted successfully!");
            // পেজ অনুযায়ী লিস্ট রিফ্রেশ
            if(collectionName === 'Books') loadBooks();
            if(collectionName === 'Research') loadResearch();
        } catch (e) { alert("Error deleting!"); }
    }
};

// কুইজ ট্যাব ওপেন
document.getElementById('tab-manage-quiz')?.addEventListener('click', () => showSection('manage-quiz-view'));

// কুইজ সেভ লজিক
const quizForm = document.getElementById('quiz-create-form');
quizForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "Quizzes"), {
            course: document.getElementById('q-course-tag').value,
            question: document.getElementById('q-question').value,
            options: [
                document.getElementById('q-opt1').value,
                document.getElementById('q-opt2').value,
                document.getElementById('q-opt3').value,
                document.getElementById('q-correct').value
            ],
            correctAnswer: document.getElementById('q-correct').value,
            createdAt: new Date()
        });
        alert("Question added!");
        quizForm.reset();
    } catch (e) { alert("Error!"); }
});

// --- Analytics & Charts Logic ---

// ১. ড্যাশবোর্ড ট্যাব ক্লিক করলে অ্যানালিটিক্স লোড হবে
document.getElementById('tab-dashboard')?.addEventListener('click', () => {
    showSection('dashboard-view');
    initAnalytics();
});

async function initAnalytics() {
    // ডাটাবেস থেকে তথ্য আনা
    const userSnap = await getDocs(collection(db, "Users"));
    const admissionSnap = await getDocs(collection(db, "Admissions"));
    
    // ১. রেভিনিউ ক্যালকুলেশন
    let totalRevenue = 0;
    admissionSnap.forEach(doc => {
        // এখানে পেমেন্ট বা প্রাইস ফিল্ড থাকলে তা যোগ হবে
        // আপাতত ডামি প্রাইস ৫০০ হিসেবে ধরছি যদি আপনার ডাটাবেসে প্রাইস না থাকে
        totalRevenue += 500; 
    });
    document.getElementById('total-revenue').innerText = totalRevenue + " BDT";
    document.getElementById('total-students').innerText = userSnap.size;
    document.getElementById('pending-count').innerText = admissionSnap.size;

    // ২. ফানেল ক্যালকুলেশন (Signup % এবং Conversion %)
    // ধরে নিচ্ছি ৫০০ ভিজিটর এসেছে (গুগল অ্যানালিটিক্স থেকে আসল ডাটা পাবেন)
    const totalVisitors = 500; 
    const signupPercent = Math.round((userSnap.size / totalVisitors) * 100);
    const paidPercent = Math.round((admissionSnap.size / userSnap.size) * 100);
    
    document.getElementById('signup-percent').innerText = signupPercent;
    document.getElementById('paid-percent').innerText = paidPercent;

    // ৩. Chart.js দিয়ে গ্রাফ তৈরি করা
    const ctx = document.getElementById('userGrowthChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'], // মাস অনুযায়ী ডাইনামিক করা সম্ভব
            datasets: [{
                label: 'New Registrations',
                data: [12, 19, 3, userSnap.size],
                borderColor: '#1B4332',
                tension: 0.4,
                fill: true,
                backgroundColor: 'rgba(27, 67, 50, 0.1)'
            }]
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } }
        }
    });
}

// হোমপেজ ম্যানেজমেন্ট ট্যাব ওপেন
document.getElementById('tab-manage-homepage')?.addEventListener('click', () => showSection('manage-homepage-view'));

// স্লাইড সেভ করা
document.getElementById('add-slide-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "HomepageSlides"), {
        title: document.getElementById('slide-title').value,
        image: document.getElementById('slide-img').value,
        createdAt: new Date()
    });
    alert("Slide Added!"); e.target.reset();
});

// ভিডিও রিভিউ সেভ করা
document.getElementById('add-video-review-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "VideoReviews"), {
        name: document.getElementById('rev-name').value,
        youtubeId: document.getElementById('rev-youtube-id').value,
        createdAt: new Date()
    });
    alert("Video Review Added!"); e.target.reset();
});

// --- Homepage Management (Delete & List) ---

// ট্যাব ক্লিক করলে ডাটা লোড হবে
document.getElementById('tab-manage-homepage')?.addEventListener('click', () => {
    showSection('manage-homepage-view');
    loadHomepageManagementData();
});

async function loadHomepageManagementData() {
    // ১. স্লাইডার লিস্ট লোড
    const slideBody = document.getElementById('slides-table-body');
    const slideSnap = await getDocs(collection(db, "HomepageSlides"));
    slideBody.innerHTML = '';
    slideSnap.forEach(doc => {
        slideBody.innerHTML += `<tr>
            <td>${doc.data().title}</td>
            <td><img src="${doc.data().image}" width="50"></td>
            <td><button class="btn" onclick="deleteDocById('HomepageSlides', '${doc.id}')" style="background:red; padding:5px;">Delete</button></td>
        </tr>`;
    });

    // ২. ভিডিও রিভিউ লিস্ট লোড
    const videoBody = document.getElementById('video-reviews-table-body');
    const videoSnap = await getDocs(collection(db, "VideoReviews"));
    videoBody.innerHTML = '';
    videoSnap.forEach(doc => {
        videoBody.innerHTML += `<tr>
            <td>${doc.data().name}</td>
            <td>${doc.data().youtubeId}</td>
            <td><button class="btn" onclick="deleteDocById('VideoReviews', '${doc.id}')" style="background:red; padding:5px;">Delete</button></td>
        </tr>`;
    });
}

// কমন ডিলিট ফাংশন (যদি আগে না থাকে)
window.deleteDocById = async (collectionName, id) => {
    if(confirm("Are you sure you want to delete this?")) {
        try {
            await deleteDoc(doc(db, collectionName, id));
            alert("Deleted successfully!");
            loadHomepageManagementData(); // টেবিল রিফ্রেশ
        } catch (e) { alert("Error deleting!"); }
    }
};

// --- Global Notification Logic ---
const notifyForm = document.getElementById('notification-form');
notifyForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const msg = document.getElementById('n-message').value;
    try {
        // আগের নোটিফিকেশন আপডেট করবে (আমরা আপাতত একটাই লেটেস্ট নোটিশ রাখবো)
        await setDoc(doc(db, "Settings", "notification"), {
            message: msg,
            createdAt: new Date()
        });
        alert("Notification sent to all students!");
        notifyForm.reset();
    } catch (e) { alert("Error!"); }
});

document.getElementById('tab-manage-live')?.addEventListener('click', () => showSection('manage-live-view'));

document.getElementById('live-class-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        await addDoc(collection(db, "LiveClasses"), {
            title: document.getElementById('l-title').value,
            date: document.getElementById('l-date').value,
            time: document.getElementById('l-time').value,
            link: document.getElementById('l-link').value,
            targetCourse: document.getElementById('l-course').value,
            createdAt: new Date()
        });
        alert("Live Class Scheduled Successfully!");
        e.target.reset();
    } catch (e) { alert("Error scheduling class."); }
});

// --- ডাইনামিক অ্যাসাইন ড্রপডাউন লজিক ---

window.openAssignModal = async (uid) => {
    window.selectedUserUid = uid;
    document.getElementById('course-modal').classList.remove('hidden');
    updateAssignDropdown(); // ড্রপডাউন লোড করবে
};

window.updateAssignDropdown = async () => {
    const type = document.getElementById('assign-type').value;
    const itemList = document.getElementById('assign-item-list');
    itemList.innerHTML = "<option>Loading...</option>";

    try {
        // যদি টাইপ কোর্স হয় তবে 'Courses' থেকে আনবে, নাহলে 'Books' থেকে
        const collectionName = (type === 'course') ? "Courses" : "Books";
        const snap = await getDocs(collection(db, collectionName));
        
        itemList.innerHTML = "";
        snap.forEach(doc => {
            const data = doc.data();
            const optionText = data.title || data.name;
            itemList.innerHTML += `<option value="${optionText}">${optionText}</option>`;
        });
    } catch (e) {
        itemList.innerHTML = "<option>Error loading items</option>";
    }
};

// কনফার্ম বাটন লজিক (আপডেট করা)
document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const type = document.getElementById('assign-type').value;
    const itemName = document.getElementById('assign-item-list').value;
    
    if (window.selectedUserUid && itemName) {
        const userRef = doc(db, "Users", window.selectedUserUid);
        try {
            if (type === 'course') {
                await updateDoc(userRef, { myCourses: arrayUnion(itemName), status: "Active" });
            } else {
                await updateDoc(userRef, { myBooks: arrayUnion(itemName), status: "Active" });
            }
            alert("Success! Access granted to " + itemName);
            document.getElementById('course-modal').classList.add('hidden');
            loadUsers(); // টেবিল রিফ্রেশ
        } catch (e) { alert("Error assigning!"); }
    }
});