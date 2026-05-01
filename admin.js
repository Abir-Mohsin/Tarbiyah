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
};

document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const courseName = document.getElementById('select-course').value;
    if (window.selectedUserUid) {
        await updateDoc(doc(db, "Users", window.selectedUserUid), { myCourses: arrayUnion(courseName), status: "Active" });
        alert("Assigned!"); document.getElementById('course-modal').classList.add('hidden'); loadUsers();
    }
});