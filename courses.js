/* 
   Tarbiyah Courses Loader (courses.js)
   ফিচার: ফায়ারস্টোর থেকে কোর্স ডাটা টেনে আনা এবং ডাইনামিক কার্ড তৈরি করা।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, orderBy, query } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const coursesContainer = document.getElementById('dynamic-courses-list');

async function loadPublicCourses() {
    if(!coursesContainer) return;
    coursesContainer.innerHTML = "<h3 style='text-align:center;'>Loading Courses...</h3>";
    
    try {
        // নতুন কোর্সগুলো আগে দেখাবে (descending order)
        const q = query(collection(db, "Courses"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        coursesContainer.innerHTML = "";
        
        if (snapshot.empty) {
            coursesContainer.innerHTML = "<p style='text-align:center;'>No courses available at the moment.</p>";
            return;
        }

        snapshot.forEach(doc => {
            const course = doc.data();
            // এখানে HTML কার্ডের স্টাইল আপনার style.css এর সাথে মিল রেখে করা হয়েছে
            coursesContainer.innerHTML += `
                <div class="card">
                    <img src="${course.image || 'https://via.placeholder.com/300'}" alt="${course.title}">
                    <h3>${course.title}</h3>
                    <p style="font-size: 0.9rem; color: #666;">${course.description.substring(0, 100)}...</p>
                    <p><strong>Price: ${course.price}</strong></p>
                    <a href="admission.html" class="btn" style="margin-top: 10px;">Enroll Now</a>
                </div>
            `;
        });
    } catch (error) {
        console.error("Error loading courses:", error);
        coursesContainer.innerHTML = "<p style='color:red; text-align:center;'>Error loading courses. Check Console.</p>";
    }
}

// পেজ লোড হলে ফাংশনটি চলবে
window.onload = loadPublicCourses;