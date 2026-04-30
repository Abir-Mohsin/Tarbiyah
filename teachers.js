import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// আপনার ফায়ারবেস কনফিগারেশন
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

async function loadPublicTeachers() {
    const list = document.getElementById('dynamic-teachers-list');
    const snap = await getDocs(collection(db, "Teachers"));
    list.innerHTML = "";
    snap.forEach(doc => {
        const t = doc.data();
        list.innerHTML += `
            <div class="card">
                <img src="${t.image}" style="width:100%; border-radius:10px;">
                <h3>${t.name}</h3>
                <p><strong>${t.subject}</strong></p>
                <p>${t.bio}</p>
            </div>`;
    });
}
window.onload = loadPublicTeachers;