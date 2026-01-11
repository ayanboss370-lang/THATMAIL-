// Firebase Configuration
const firebaseConfig = {
  apiKey: "AIzaSyBJW4cHDKrF4aV9AXO39GJPoqsSGY_7Blc",
  authDomain: "thatmail-7b5c9.firebaseapp.com",
  databaseURL: "https://thatmail-7b5c9-default-rtdb.firebaseio.com",
  projectId: "thatmail-7b5c9",
  storageBucket: "thatmail-7b5c9.firebasestorage.app",
  messagingSenderId: "518298518980",
  appId: "1:518298518980:web:cc8c7e87a0863be2901091"
};

// Initialize Firebase
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const auth = firebase.auth();
const db = firebase.database();
emailjs.init("53NSgM2ZXERPbzyXX");

let activeChatId = "global";

// --- AUTH STATE ---
auth.onAuthStateChanged(user => {
    const welcome = document.getElementById('welcome-screen');
    const login = document.getElementById('login-screen');
    const chat = document.getElementById('chat-screen');

    if (user) {
        welcome.style.display = 'none';
        login.style.display = 'none';
        chat.style.display = 'flex';
        
        // Load User Profile
        db.ref("users/" + user.uid).on("value", snap => {
            const data = snap.val();
            if (data) {
                document.getElementById('header-pic').src = data.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
                document.getElementById('prof-name').innerText = data.name || "User";
                document.getElementById('prof-phone').innerText = "Phone: " + (data.phone || "Not Set");
                document.getElementById('profile-pic-display').src = data.profilePic || "https://cdn-icons-png.flaticon.com/512/149/149071.png";
            }
        });
        loadMessages("global");
    } else {
        welcome.style.display = 'flex';
        chat.style.display = 'none';
    }
});

// --- CONTACTS SYSTEM (NEW & IMPROVED) ---
async function toggleContacts() {
    const side = document.getElementById('contact-sidebar');
    side.style.display = side.style.display === 'none' ? 'block' : 'none';
    
    if(side.style.display === 'block') {
        const list = document.getElementById('contact-list');
        
        // UI for Manual Number Input
        list.innerHTML = `
            <div style="padding:15px; border-bottom:1px solid #ddd;">
                <p style="margin:0 0 10px 0; font-size:14px; font-weight:bold;">Start New Chat</p>
                <input type="tel" id="manual-phone" placeholder="Enter Mobile Number" 
                       style="width:100%; padding:10px; margin-bottom:10px; border:1px solid #ccc; border-radius:5px;">
                <button onclick="addManualContact()" 
                        style="width:100%; padding:10px; background:#075e54; color:white; border:none; border-radius:5px; cursor:pointer;">
                        Open Chat
                </button>
            </div>
            <div id="contacts-display-area">
                <p style="padding:10px; color:gray;">Loading phone contacts...</p>
            </div>
        `;
        
        const displayArea = document.getElementById('contacts-display-area');
        
        try {
            // Trying Phone Contacts
            if ('contacts' in navigator && window.isSecureContext) {
                const contacts = await navigator.contacts.select(['name', 'tel'], {multiple: true});
                if (contacts.length > 0) {
                    renderContactList(contacts, displayArea);
                } else {
                    showDefaultContacts(displayArea);
                }
            } else {
                showDefaultContacts(displayArea);
            }
        } catch (e) {
            showDefaultContacts(displayArea);
        }
    }
}

function addManualContact() {
    const phone = document.getElementById('manual-phone').value.trim();
    if(phone.length >= 10) {
        startDirectChat("Chat: " + phone, phone);
    } else {
        alert("Please enter a valid mobile number.");
    }
}

function showDefaultContacts(container) {
    const defaults = [
        { name: "Ayan (Admin)", tel: ["+91 9999999999"] },
        { name: "Support Team", tel: ["+91 0000000000"] }
    ];
    container.innerHTML = "<p style='padding:10px; font-size:12px; color:red;'>Note: Phone contacts restricted by system.</p>";
    renderContactList(defaults, container);
}

function renderContactList(data, container) {
    data.forEach(c => {
        const div = document.createElement('div');
        div.className = "contact-item";
        div.style.padding = "10px";
        div.style.borderBottom = "1px solid #eee";
        div.style.cursor = "pointer";
        div.innerHTML = `<b>${c.name}</b><br><small>${c.tel[0]}</small>`;
        div.onclick = () => startDirectChat(c.name, c.tel[0]);
        container.appendChild(div);
    });
}

// --- CHAT LOGIC ---
function startDirectChat(name, phone) {
    activeChatId = phone.replace(/\D/g,'');
    document.getElementById('chat-title').innerText = name;
    document.getElementById('back-to-list').style.display = "inline";
    document.getElementById('contact-sidebar').style.display = "none";
    loadMessages(activeChatId);
}

function closeDirectChat() {
    activeChatId = "global";
    document.getElementById('chat-title').innerText = "THATMAIL";
    document.getElementById('back-to-list').style.display = "none";
    loadMessages("global");
}

function loadMessages(chatId) {
    const box = document.getElementById('messages');
    box.innerHTML = "";
    db.ref("messages/" + chatId).off();
    db.ref("messages/" + chatId).limitToLast(50).on("child_added", snap => {
        const m = snap.val();
        const div = document.createElement('div');
        div.className = `msg ${m.uid === auth.currentUser.uid ? 'mine' : 'theirs'}`;
        div.innerHTML = `<small style="font-size:10px; color:gray;">${m.sender}</small><br>${m.text}`;
        box.appendChild(div);
        box.scrollTop = box.scrollHeight;
    });
}

document.getElementById('send-btn').onclick = () => {
    const input = document.getElementById('msg-input');
    if(input.value && auth.currentUser) {
        db.ref("messages/" + activeChatId).push({
            uid: auth.currentUser.uid,
            sender: auth.currentUser.email.split('@')[0],
            text: input.value,
            timestamp: Date.now()
        });
        input.value = "";
    }
};

// --- AUTH HELPERS ---
function forceLogout() {
    auth.signOut().then(() => window.location.reload());
}

function goToAuth() { 
    document.getElementById('welcome-screen').style.display = 'none'; 
    document.getElementById('login-screen').style.display = 'flex'; 
}

function backToWelcome() { 
    document.getElementById('welcome-screen').style.display = 'flex'; 
    document.getElementById('login-screen').style.display = 'none'; 
}

// Signup & OTP
document.getElementById('signup-request-btn').onclick = () => {
    const email = document.getElementById('email').value;
    if(!email) return alert("Enter Email");
    let otp = Math.floor(1000 + Math.random() * 9000);
    emailjs.send("service_dpnrsiq", "template_72j2jus", { to_email: email, otp_code: otp })
    .then(() => {
        window.generatedOTP = otp;
        document.getElementById('otp-area').style.display = 'block';
        alert("OTP Sent to Email!");
    });
};

document.getElementById('verify-btn').onclick = () => {
    const otp = document.getElementById('otp-input').value;
    if(otp == window.generatedOTP) {
        auth.createUserWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value)
        .then(res => {
            db.ref("users/" + res.user.uid).set({
                name: document.getElementById('user-name').value,
                email: document.getElementById('email').value,
                phone: document.getElementById('phone').value,
                profilePic: "https://cdn-icons-png.flaticon.com/512/149/149071.png"
            });
        });
    } else alert("Wrong OTP");
};

document.getElementById('login-btn').onclick = () => {
    auth.signInWithEmailAndPassword(document.getElementById('email').value, document.getElementById('password').value)
    .catch(e => alert(e.message));
};

function openProfile() { document.getElementById('profile-modal').style.display = 'flex'; }
function closeProfile() { document.getElementById('profile-modal').style.display = 'none'; }
          
