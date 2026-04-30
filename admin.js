/* 
   Tarbiyah Admin Master Script - Final Fixed Version
   ফিচার: Admissions, Users, Courses, Videos, Blogs, Teachers, Settings.
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
const adminWrapper = document.querySelector('.admin-wrapper');
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

// ৩. সাইডবার ট্যাব পরিবর্তন লজিক
function showSection(id) {
    document.querySelectorAll('.admin-card').forEach(card => card.classList.add('hidden'));
    document.querySelectorAll('.sidebar-links li').forEach(li => li.classList.remove('active'));
    
    const target = document.getElementById(id);
    if(target) target.classList.remove('hidden');

    const tabId = "tab-" + id.replace('-view', '');
    const activeTab = document.getElementById(tabId);
    if(activeTab) activeTab.classList.add('active');
}

// ট্যাব বাটন লিসেনারস
document.getElementById('tab-admissions')?.addEventListener('click', () => { showSection('admissions-view'); loadAdmissions(); });
document.getElementById('tab-users')?.addEventListener('click', () => { showSection('users-view'); loadUsers(); });
document.getElementById('tab-manage-courses')?.addEventListener('click', () => showSection('manage-courses-view'));
document.getElementById('tab-add-video')?.addEventListener('click', () => showSection('add-video-view'));
document.getElementById('tab-manage-blogs')?.addEventListener('click', () => { showSection('manage-blogs-view'); loadBlogs(); });
document.getElementById('tab-manage-teachers')?.addEventListener('click', () => { showSection('manage-teachers-view'); loadTeachers(); });
document.getElementById('tab-settings')?.addEventListener('click', () => showSection('settings-view'));

// ৪. ডাটা লোড করার ফাংশনসমূহ (Blogs, Teachers, Users, Admissions)

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
        tbody.innerHTML += `<tr><td>${u.name}</td><td>${u.email}</td><td>${courses}</td><td><button class="btn" onclick="openAssignModal('${userDoc.id}')">Assign</button></td></tr>`;
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
        tbody.innerHTML += `<tr><td>${b.title}</td><td><img src="${b.image}" width="50"></td><td>
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

// ৫. ফর্ম সাবমিশন লজিক (Add/Update)

// ব্লগ সেভ
const bForm = document.getElementById('blog-upload-form');
bForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-blog-id').value;
    const data = { title: document.getElementById('b-title').value, image: document.getElementById('b-img').value, content: document.getElementById('b-content').value, createdAt: new Date() };
    if (editId) await updateDoc(doc(db, "Blogs", editId), data);
    else await addDoc(collection(db, "Blogs"), data);
    alert("Saved!"); bForm.reset(); document.getElementById('edit-blog-id').value = ""; loadBlogs();
});

// টিচার সেভ
const tForm = document.getElementById('teacher-upload-form');
tForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-teacher-id').value;
    const data = { name: document.getElementById('t-name').value, subject: document.getElementById('t-subject').value, image: document.getElementById('t-img').value, bio: document.getElementById('t-bio').value };
    if (editId) await updateDoc(doc(db, "Teachers", editId), data);
    else await addDoc(collection(db, "Teachers"), data);
    alert("Saved!"); tForm.reset(); document.getElementById('edit-teacher-id').value = ""; loadTeachers();
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

// ৬. গ্লোবাল ফাংশনস (Window Object) যাতে HTML থেকে কাজ করে

window.editBlog = async (id) => {
    const snap = await getDoc(doc(db, "Blogs", id));
    const b = snap.data();
    document.getElementById('b-title').value = b.title;
    document.getElementById('b-img').value = b.image;
    document.getElementById('b-content').value = b.content;
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
};

document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const courseName = document.getElementById('select-course').value;
    if (window.selectedUserUid) {
        await updateDoc(doc(db, "Users", window.selectedUserUid), { myCourses: arrayUnion(courseName), status: "Active" });
        alert("Assigned!"); document.getElementById('course-modal').classList.add('hidden'); loadUsers();
    }
});

// admin.js এর একদম নিচে যোগ করুন

// Theme & Branding Settings Save
const themeForm = document.getElementById('theme-settings-form');
themeForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const themeData = {
            siteName: document.getElementById('s-name').value || "Tarbiyah",
            logoImg: document.getElementById('s-logo-img').value || "",
            primaryColor: document.getElementById('s-primary-color').value || "#1B4332",
            accentColor: document.getElementById('s-accent-color').value || "#D4AF37",
            fontUrl: document.getElementById('s-font-url').value || ""
        };

        // Settings কালেকশনে theme নামের ডকুমেন্টে সেভ হবে
        await setDoc(doc(db, "Settings", "theme"), themeData);
        alert("MashaAllah! Theme and Branding Updated Successfully.");
    } catch (error) {
        console.error("Theme Update Error: ", error);
        alert("Failed to update theme.");
    }
});

// অ্যাডমিন প্যানেলে Theme ট্যাব ওপেন করার ইভেন্ট
document.getElementById('tab-theme-settings')?.addEventListener('click', () => { 
    showSection('theme-settings-view'); 
});