/* 
   Tarbiyah Blog Loader (blog.js)
   ফিচার: অ্যাডমিন থেকে পোস্ট করা ব্লগগুলো ইমেজসহ এখানে শো করবে।
*/

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

const blogContainer = document.getElementById('dynamic-blog-list');

async function loadBlogs() {
    try {
        const q = query(collection(db, "Blogs"), orderBy("createdAt", "desc"));
        const querySnapshot = await getDocs(q);
        
        blogContainer.innerHTML = "";
        
        if (querySnapshot.empty) {
            blogContainer.innerHTML = "<p style='text-align:center;'>No articles published yet.</p>";
            return;
        }

        querySnapshot.forEach((doc) => {
            const blog = doc.data();
            // কন্টেন্ট অনেক বড় হলে ছোট করে দেখানো (Snippet)
            const snippet = blog.content.length > 120 ? blog.content.substring(0, 120) + "..." : blog.content;

            blogContainer.innerHTML += `
                <div class="card">
                    <img src="${blog.image || 'https://via.placeholder.com/400'}" alt="${blog.title}" style="width:100%; border-radius:10px; margin-bottom:15px;">
                    <h3>${blog.title}</h3>
                    <p>${snippet}</p>
                    <br>
                    <a href="view-blog.html?id=${doc.id}" class="btn" style="font-size: 0.8rem;">Read Full Article &rarr;</a>
                </div>
            `;
        });
    } catch (error) {
        console.error(error);
        blogContainer.innerHTML = "<p>Error loading blogs. Please try again later.</p>";
    }
    querySnapshot.forEach((doc) => {
            const blog = doc.data();
            
            // HTML ট্যাগ রিমুভ করে শুধু ক্লিন টেক্সট বের করা
            const tempDiv = document.createElement("div");
            tempDiv.innerHTML = blog.content;
            const cleanText = tempDiv.textContent || tempDiv.innerText || "";
            
            const snippet = cleanText.length > 120 ? cleanText.substring(0, 120) + "..." : cleanText;

            blogContainer.innerHTML += `
                <div class="card">
                    <img src="${blog.image || 'https://via.placeholder.com/400'}" alt="${blog.title}" style="width:100%; border-radius:10px; margin-bottom:15px;">
                    <h3>${blog.title}</h3>
                    <p>${snippet}</p>
                    <br>
                    <a href="view-blog.html?id=${doc.id}" class="btn" style="font-size: 0.8rem;">Read Full Article &rarr;</a>
                </div>
            `;
        });
}

window.onload = loadBlogs;