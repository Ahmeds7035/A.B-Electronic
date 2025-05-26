// استيراد وظائف Firebase Modular SDK
import { initializeApp }               from "https://www.gstatic.com/firebasejs/11.8.1/firebase-app.js";
import { getAnalytics }                from "https://www.gstatic.com/firebasejs/11.8.1/firebase-analytics.js";
import {
  getFirestore, collection, addDoc,
  getDocs, deleteDoc, doc, query,
  orderBy, serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-firestore.js";
import {
  getStorage, ref, uploadBytes,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/11.8.1/firebase-storage.js";

// تهيئة Firebase
const firebaseConfig = {
  apiKey:    "AIzaSyAAEiYmVQ-tq34uHI0AFPOOcw_Ow4v_j30",
  authDomain:"abelectronic-e8ee9.firebaseapp.com",
  projectId: "abelectronic-e8ee9",
  storageBucket: "abelectronic-e8ee9.appspot.com",
  messagingSenderId: "740876799433",
  appId:      "1:740876799433:web:4c582934bf9f8fe4792c18",
  measurementId:"G-FY5XTH5376"
};

const app      = initializeApp(firebaseConfig);
const analytics= getAnalytics(app);
const db       = getFirestore(app);
const storage  = getStorage(app);

// DOM Elements
const ADMIN_PASS = atob("SGVsbG9AV29ybGQ5MA==");
let isAdmin = false;

const loginBtn    = document.getElementById('login-btn');
const addBtn      = document.getElementById('add-product-btn');
const formDiv     = document.getElementById('add-product-form');
const saveBtn     = document.getElementById('save-product');
const imgInput    = document.getElementById('img-file');
const container   = document.getElementById('products-container');

// تسجيل دخول/خروج الأدمن
loginBtn.addEventListener('click', () => {
  if (!isAdmin) {
    const p = prompt('كلمة مرور الأدمن:');
    if (p === ADMIN_PASS) {
      isAdmin = true;
      alert('تم تسجيل الدخول كأدمن!');
    } else {
      alert('كلمة المرور غير صحيحة.');
    }
  } else {
    isAdmin = false;
    alert('تم تسجيل الخروج.');
  }
  updateUI();
});

// تحديث واجهة الأدمن
function updateUI() {
  loginBtn.textContent = isAdmin ? 'تسجيل خروج' : 'تسجيل دخول';
  addBtn.style.display = isAdmin ? 'inline-block' : 'none';
  formDiv.style.display = 'none';
  document.querySelectorAll('.card')
    .forEach(c => c.classList.toggle('admin', isAdmin));
}

// إظهار/إخفاء نموذج الإضافة
addBtn.addEventListener('click', () => {
  formDiv.style.display = formDiv.style.display === 'block' ? 'none' : 'block';
});

// إضافة منتج جديد
saveBtn.addEventListener('click', async () => {
  try {
    const name  = document.getElementById('prod-name').value.trim();
    const desc  = document.getElementById('prod-desc').value.trim();
    const price = document.getElementById('prod-price').value.trim();
    const wa    = document.getElementById('whatsapp-number').value.trim();
    const file  = imgInput.files[0];
    if (!name || !desc || !price || !wa || !file) {
      return alert('يرجى تعبئة جميع الحقول.');
    }

    // رفع الصورة
    const imgRef = ref(storage, `products/${Date.now()}_${file.name}`);
    const snap   = await uploadBytes(imgRef, file);
    const imgURL = await getDownloadURL(snap.ref);

    // حفظ المستند في Firestore
    await addDoc(collection(db, 'products'), {
      name, desc, price, wa, img: imgURL,
      createdAt: serverTimestamp()
    });

    alert('تم إضافة المنتج بنجاح!');

    // تفريغ الحقول
    document.getElementById('prod-name').value = '';
    document.getElementById('prod-desc').value = '';
    document.getElementById('prod-price').value = '';
    document.getElementById('whatsapp-number').value = '';
    imgInput.value = '';

    loadProducts();
  } catch (e) {
    console.error('Error saving product:', e);
    alert('حدث خطأ أثناء الحفظ. افتح Console للتحقق.');
  }
});

// تحميل وعرض المنتجات
async function loadProducts() {
  const q        = query(collection(db, 'products'), orderBy('createdAt','desc'));
  const snapshot = await getDocs(q);
  container.innerHTML = '';

  snapshot.forEach(docSnap => {
    const p = { id: docSnap.id, ...docSnap.data() };
    const card = document.createElement('div');
    card.className = 'card';
    card.innerHTML = `
      <button class="delete-btn">×</button>
      <img src="${p.img}" alt="${p.name}">
      <div class="card-content">
        <h2 class="product-name">${p.name}</h2>
        <p class="product-desc">${p.desc}</p>
        <div class="product-price">${p.price}</div>
        <div class="action-row">
          <input type="number" value="1" min="1" class="quantity-input">
          <a class="buy-button" target="_blank">شراء عبر واتساب</a>
        </div>
      </div>`;

    // رابط واتساب
    const qtyInput = card.querySelector('.quantity-input');
    const buyLink  = card.querySelector('.buy-button');
    function updateLink() {
      const msg = encodeURIComponent(
        `السلام عليكم،\nأرغب في شراء: ${p.name}\nالسعر: ${p.price}\nالكمية: ${qtyInput.value}`
      );
      buyLink.href = `https://wa.me/${p.wa}?text=${msg}`;
    }
    qtyInput.addEventListener('input', updateLink);
    updateLink();

    // زر الحذف للأدمن
    card.querySelector('.delete-btn').addEventListener('click', async () => {
      await deleteDoc(doc(db, 'products', p.id));
      loadProducts();
    });

    container.appendChild(card);
  });

  updateUI();
}

// التنفيذ الأولي
loadProducts();
