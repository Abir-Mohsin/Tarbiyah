/* Tarbiyah Courses & Search Loader (courses.js) */

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

async function loadPublicCourses() {
    const coursesContainer = document.getElementById('dynamic-courses-list');
    if(!coursesContainer) return;

    coursesContainer.innerHTML = "<h3 style='text-align:center; grid-column: 1/-1;'>Loading Courses...</h3>";
    
    // URL থেকে সার্চ কিওয়ার্ড নেওয়া
    const urlParams = new URLSearchParams(window.location.search);
    const searchQuery = urlParams.get('q')?.toLowerCase() || "";

    try {
        const q = query(collection(db, "Courses"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        coursesContainer.innerHTML = "";
        let foundCount = 0;

        if (snapshot.empty) {
            coursesContainer.innerHTML = "<p style='grid-column: 1/-1; text-align:center;'>No courses available right now.</p>";
            return;
        }

        snapshot.forEach(doc => {
            const course = doc.data();
            
            // ডাটাবেসে title বা tag না থাকলেও যেন ক্র্যাশ না করে তার জন্য '?' (Optional Chaining) ব্যবহার করা হয়েছে
            const cTitle = course.title?.toLowerCase() || "";
            const cTag = course.tag?.toLowerCase() || "";

            // সার্চ ফিল্টার লজিক
            if (searchQuery) {
                if (!cTitle.includes(searchQuery) && !cTag.includes(searchQuery)) {
                    return; // যদি কিওয়ার্ড না মিলে, তবে কার্ডটি স্কিপ করবে
                }
            }

            foundCount++;
            coursesContainer.innerHTML += `
                <div class="card">
                    <img src="${course.image || 'https://via.placeholder.com/300'}" alt="Course Image" style="width:100%; border-radius:10px; height:180px; object-fit:cover;">
                    <h3 style="margin-top: 15px;">${course.title || 'Untitled Course'}</h3>
                    <p style="font-size: 0.9rem; color: #666;">${course.description ? course.description.substring(0, 80) + '...' : ''}</p>
                    <p style="margin: 10px 0;"><strong>Price: ${course.price == 0 ? '<span style="color:green;">FREE</span>' : course.price + ' BDT'}</strong></p>
                    <a href="admission.html" class="btn">Enroll Now</a>
                </div>
            `;
        });

        // যদি সার্চ করার পর কিছু না পায়
        if (foundCount === 0) {
            coursesContainer.innerHTML = `<p style="grid-column: 1/-1; text-align: center; color: red;">No courses found matching "${searchQuery}".</p>`;
        }
    } catch (error) {
        console.error(error);
        coursesContainer.innerHTML = "<p style='color:red; text-align:center; grid-column: 1/-1;'>Error loading courses!</p>";
    }
}

window.onload = loadPublicCourses;