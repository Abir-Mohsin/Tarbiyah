import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* আপনার কনফিগারেশন */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadLibrary() {
    const list = document.getElementById('books-list');
    const q = query(collection(db, "Books"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);
    
    list.innerHTML = "";
    snap.forEach(doc => {
        const b = doc.data();
        list.innerHTML += `
            <div class="card">
                <img src="${b.image}" style="width:100%; border-radius:10px; height:250px; object-fit:cover;">
                <h3>${b.title}</h3>
                <p>By ${b.author}</p>
                <h4 style="color:var(--primary-green)">${b.price == 0 ? 'FREE' : b.price + ' BDT'}</h4>
                <a href="${b.pdf}" target="_blank" class="btn" style="margin-top:10px;">${b.price == 0 ? 'Read Now' : 'Buy Now'}</a>
            </div>`;
    });
}
window.onload = loadLibrary;