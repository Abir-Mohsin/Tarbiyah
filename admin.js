/* 
   Tarbiyah Admin Master Logic
   সবগুলো ফিচার এখানে একসাথে গুছিয়ে দেওয়া হয়েছে।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { 
    getFirestore, collection, getDocs, addDoc, updateDoc, setDoc, doc, arrayUnion, query, orderBy, onSnapshot 
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
const adminWrapper = document.querySelector('.admin-wrapper'); // সাইডবারসহ মেইন এরিয়া
const ADMIN_PASSWORD = "admin123"; 

if (loginBtn) {
    loginBtn.addEventListener('click', () => {
        if (passwordInput.value === ADMIN_PASSWORD) {
            loginSection.classList.add('hidden');
            adminWrapper.classList.remove('hidden');
            loadAdmissions(); // ডিফল্টভাবে প্রথম ডাটা লোড হবে
        } else {
            document.getElementById('error-msg').style.display = 'block';
        }
    });
}

// ৩. সাইডবার সেকশন কন্ট্রোল (এখানেই এররটি ছিল, এখন এটি ইউনিক)
function showSection(id) {
    // সব কার্ড হাইড করা
    document.querySelectorAll('.admin-card').forEach(card => card.classList.add('hidden'));
    // সব ট্যাব থেকে একটিভ ক্লাস সরানো
    document.querySelectorAll('.sidebar-links li').forEach(li => li.classList.remove('active'));
    
    // নির্দিষ্ট কার্ডটি দেখানো
    const targetSection = document.getElementById(id);
    if(targetSection) targetSection.classList.remove('hidden');

    // সাইডবার বাটনে একটিভ ক্লাস দেওয়া
    const tabId = "tab-" + id.replace('-view', '');
    const activeTab = document.getElementById(tabId);
    if(activeTab) activeTab.classList.add('active');
}

// ৪. ট্যাব বাটন লিসেনারস
document.getElementById('tab-admissions')?.addEventListener('click', () => { showSection('admissions-view'); loadAdmissions(); });
document.getElementById('tab-users')?.addEventListener('click', () => { showSection('users-view'); loadUsers(); });
document.getElementById('tab-manage-courses')?.addEventListener('click', () => showSection('manage-courses-view'));
document.getElementById('tab-add-video')?.addEventListener('click', () => showSection('add-video-view'));
document.getElementById('tab-manage-blogs')?.addEventListener('click', () => showSection('manage-blogs-view'));
document.getElementById('tab-settings')?.addEventListener('click', () => showSection('settings-view'));

// ৫. ডাটাবেস থেকে ডাটা লোড করার ফাংশনসমূহ

async function loadAdmissions() {
    const tbody = document.querySelector('#admissions-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    const snap = await getDocs(collection(db, "Admissions"));
    tbody.innerHTML = '';
    snap.forEach(doc => {
        const data = doc.data();
        tbody.innerHTML += `<tr><td>${data.name}</td><td>${data.email}</td><td>${data.course}</td><td>${data.trxId}</td></tr>`;
    });
}

async function loadUsers() {
    const tbody = document.querySelector('#users-table tbody');
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="4">Loading...</td></tr>';
    const snap = await getDocs(collection(db, "Users"));
    tbody.innerHTML = '';
    snap.forEach(userDoc => {
        const user = userDoc.data();
        const courses = user.myCourses ? user.myCourses.join(", ") : "None";
        tbody.innerHTML += `<tr>
            <td>${user.name}</td><td>${user.email}</td><td>${courses}</td>
            <td><button class="btn" onclick="openAssignModal('${userDoc.id}')" style="padding:5px;">Assign Course</button></td>
        </tr>`;
    });
}

// ৬. কোর্স অ্যাসাইন (Modal) লজিক
let selectedUserUid = "";
window.openAssignModal = (uid) => {
    selectedUserUid = uid;
    document.getElementById('course-modal').classList.remove('hidden');
};

document.getElementById('confirm-assign')?.addEventListener('click', async () => {
    const courseName = document.getElementById('select-course').value;
    if (selectedUserUid) {
        const userRef = doc(db, "Users", selectedUserUid);
        await updateDoc(userRef, {
            myCourses: arrayUnion(courseName),
            status: "Active"
        });
        alert("Course assigned successfully!");
        document.getElementById('course-modal').classList.add('hidden');
        loadUsers();
    }
});

// ৭. আপলোড ফাংশনসমূহ (Video, Course, Blog, Settings)

// ভিডিও আপলোড
const videoForm = document.getElementById('video-upload-form');
videoForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "Videos"), {
        title: document.getElementById('v-title').value,
        url: `https://www.youtube.com/embed/${document.getElementById('v-url').value}`,
        course: document.getElementById('v-course').value,
        order: parseInt(document.getElementById('v-order').value)
    });
    alert("Lesson Added!");
    videoForm.reset();
});

// পাবলিক কোর্স পাবলিশ
const courseForm = document.getElementById('course-create-form');
courseForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "Courses"), {
        title: document.getElementById('c-title').value,
        tag: document.getElementById('c-tag').value,
        image: document.getElementById('c-img').value,
        price: document.getElementById('c-price').value,
        description: document.getElementById('c-desc').value,
        createdAt: new Date()
    });
    alert("Course Published!");
    courseForm.reset();
});

// সেটিংস আপডেট
const settingsForm = document.getElementById('settings-form');
settingsForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    await setDoc(doc(db, "Settings", "global"), {
        siteName: document.getElementById('s-name').value,
        announcement: document.getElementById('s-announcement').value
    });
    alert("Settings Updated!");
});

// ১. ব্লগ ডাটা লোড করার ফাংশন
async function loadBlogs() {
    const tbody = document.querySelector('#blogs-table-body'); // এই আইডিটি HTML-এ থাকতে হবে
    if(!tbody) return;
    tbody.innerHTML = '<tr><td colspan="3">Loading articles...</td></tr>';
    
    try {
        const q = query(collection(db, "Blogs"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        tbody.innerHTML = '';
        
        if(snap.empty) {
            tbody.innerHTML = '<tr><td colspan="3">No blogs published yet.</td></tr>';
            return;
        }

        snap.forEach(blogDoc => {
            const blog = blogDoc.data();
            tbody.innerHTML += `
                <tr>
                    <td>${blog.title}</td>
                    <td><img src="${blog.image}" style="width:50px; height:30px; object-fit:cover;"></td>
                    <td><button class="btn" onclick="deleteBlog('${blogDoc.id}')" style="background:red; padding:5px;">Delete</button></td>
                </tr>`;
        });
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" style="color:red;">Error loading blogs!</td></tr>';
    }
}

// ২. ট্যাব ক্লিক ইভেন্ট আপডেট
document.getElementById('tab-manage-blogs')?.addEventListener('click', () => { 
    showSection('manage-blogs-view'); 
    loadBlogs(); // এটি যোগ করতে হবে
});

import { deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// --- ১. ব্লগ ডিলিট এবং এডিট লজিক ---

// ডিলিট ফাংশন
window.deleteBlog = async (id) => {
    if(confirm("Are you sure you want to delete this article?")) {
        await deleteDoc(doc(db, "Blogs", id));
        alert("Blog Deleted!");
        loadBlogs();
    }
}

// এডিট করার জন্য ফর্ম পূরণ করা
window.editBlog = async (id) => {
    const docSnap = await getDoc(doc(db, "Blogs", id));
    if (docSnap.exists()) {
        const blog = docSnap.data();
        document.getElementById('b-title').value = blog.title;
        document.getElementById('b-img').value = blog.image;
        document.getElementById('b-content').value = blog.content;
        document.getElementById('edit-blog-id').value = id; // আইডি সেভ রাখা
        document.querySelector('#manage-blogs-view h3').innerText = "Edit Blog Article";
        window.scrollTo(0, 0);
    }
}

// ব্লগ সেভ লজিক (Update/Create) আপডেট
const blogForm = document.getElementById('blog-upload-form');
blogForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-blog-id').value;
    const blogData = {
        title: document.getElementById('b-title').value,
        image: document.getElementById('b-img').value,
        content: document.getElementById('b-content').value,
        createdAt: new Date()
    };

    try {
        if (editId) {
            await updateDoc(doc(db, "Blogs", editId), blogData);
            alert("Blog Updated!");
        } else {
            await addDoc(collection(db, "Blogs"), blogData);
            alert("Blog Published!");
        }
        blogForm.reset();
        document.getElementById('edit-blog-id').value = "";
        loadBlogs();
    } catch (e) { alert("Error!"); }
});

// --- ২. টিচার ম্যানেজমেন্ট লজিক ---

const teacherForm = document.getElementById('teacher-upload-form');
teacherForm?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const editId = document.getElementById('edit-teacher-id').value;
    const teacherData = {
        name: document.getElementById('t-name').value,
        subject: document.getElementById('t-subject').value,
        image: document.getElementById('t-img').value,
        bio: document.getElementById('t-bio').value
    };

    if (editId) {
        await updateDoc(doc(db, "Teachers", editId), teacherData);
    } else {
        await addDoc(collection(db, "Teachers"), teacherData);
    }
    alert("Teacher Info Saved!");
    teacherForm.reset();
    document.getElementById('edit-teacher-id').value = "";
    loadTeachers();
});

async function loadTeachers() {
    const tbody = document.getElementById('teachers-table-body');
    if(!tbody) return;
    const snap = await getDocs(collection(db, "Teachers"));
    tbody.innerHTML = '';
    snap.forEach(tDoc => {
        const t = tDoc.data();
        tbody.innerHTML += `
            <tr>
                <td>${t.name}</td>
                <td>${t.subject}</td>
                <td>
                    <button onclick="editTeacher('${tDoc.id}')" class="btn" style="padding:5px;">Edit</button>
                    <button onclick="deleteTeacher('${tDoc.id}')" class="btn" style="background:red; padding:5px;">Delete</button>
                </td>
            </tr>`;
    });
}

window.deleteTeacher = async (id) => {
    if(confirm("Delete this teacher?")) {
        await deleteDoc(doc(db, "Teachers", id));
        loadTeachers();
    }
}

window.editTeacher = async (id) => {
    const snap = await getDoc(doc(db, "Teachers", id));
    const t = snap.data();
    document.getElementById('t-name').value = t.name;
    document.getElementById('t-subject').value = t.subject;
    document.getElementById('t-img').value = t.image;
    document.getElementById('t-bio').value = t.bio;
    document.getElementById('edit-teacher-id').value = id;
    window.scrollTo(0,0);
}

// ট্যাব লজিক আপডেট
document.getElementById('tab-manage-teachers')?.addEventListener('click', () => { 
    showSection('manage-teachers-view'); 
    loadTeachers(); 
});