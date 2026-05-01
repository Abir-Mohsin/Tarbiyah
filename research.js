import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = { /* আপনার কনফিগারেশন */ };
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function loadResearchPage() {
    const list = document.getElementById('research-list');
    const q = query(collection(db, "Research"), orderBy("createdAt", "desc"));
    
    try {
        const snap = await getDocs(q);
        list.innerHTML = "";
        
        if (snap.empty) {
            list.innerHTML = "<p>No research papers found.</p>";
            return;
        }

        snap.forEach(doc => {
            const r = doc.data();
            list.innerHTML += `
                <div class="card" style="text-align: left; border-left: 5px solid var(--soft-gold);">
                    <small style="color:var(--soft-gold); font-weight:bold;">${r.category || 'RESEARCH'}</small>
                    <h3 style="margin: 10px 0;">${r.title}</h3>
                    <p style="font-size: 0.8rem; color: #666; margin-bottom: 15px;">Published on: ${new Date(r.createdAt.seconds * 1000).toLocaleDateString()}</p>
                    <a href="${r.link}" target="_blank" class="btn" style="width:100%;">Download / Read Paper</a>
                </div>`;
        });
    } catch (e) {
        list.innerHTML = "Error loading papers.";
    }
}
window.onload = loadResearchPage;