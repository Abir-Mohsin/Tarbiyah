import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// ... (Firebase Initialize করার কোড আগের মতোই থাকবে)

async function loadBooks() {
    const listArea = document.getElementById('books-list');
    if(!listArea) return;

    try {
        const q = query(collection(db, "Books"), orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        listArea.innerHTML = "";

        snap.forEach(doc => {
            const b = doc.data();
            const bookId = doc.id;

            listArea.innerHTML += `
                <div class="card">
                    <img src="${b.image}" style="width:100%; border-radius:10px; height:200px; object-fit:cover;">
                    <h3 style="margin-top:10px;">${b.title}</h3>
                    <p>By ${b.author}</p>
                    <p style="font-weight:bold; color:var(--primary-green);">${b.price == 0 ? 'FREE' : b.price + ' BDT'}</p>
                    
                    <div style="margin-top:10px;">
                        ${b.price == 0 
                            ? `<button onclick="window.openPdfReader('${b.title}', '${b.pdf}')" class="btn" style="width:100%;">Read Now</button>`
                            : `<button onclick="window.buyBook('${bookId}', '${b.title}', '${b.price}')" class="btn" style="width:100%; background:var(--soft-gold); color:black !important; border:none;">Buy to Read</button>`
                        }
                    </div>
                </div>
            `;
        });
    } catch (e) { console.log(e); }
}

// এইচটিএমএল বাটন থেকে কল করার জন্য উইন্ডোতে এসাইন করা
window.openPdfReader = (title, pdfUrl) => {
    // এই ফাংশনটি শুধু ড্যাশবোর্ডের ভেতরে থাকলে ভালো কাজ করে। 
    // পাবলিক পেজে আপনি চাইলে সরাসরি লিঙ্ক ওপেন করতে পারেন।
    window.open(pdfUrl, "_blank"); 
};

window.buyBook = (id, title, price) => {
    // পেমেন্ট পেজে পাঠিয়ে দিবে এবং ইউআরএল এ বইয়ের তথ্য থাকবে
    window.location.href = `admission.html?type=book&id=${id}&title=${encodeURIComponent(title)}&price=${price}`;
};

window.onload = loadBooks;