/* =========================
   KONFIGURASI
========================= */
const URL_SEBLAK = "https://script.google.com/macros/s/AKfycbwu1-NwVvt_WajiReoNIfIf8Hk36a0aBPXYjuMR07j-RKvtCQ2fMeroe_M5WIKuXZaM9Q/exec";
const URL_MINUMAN = "https://script.google.com/macros/s/AKfycbyWbhS8r_sMe-wI3FE5qR4iCPOi6GnR2xb0uA788zUq5d4gM7TNOWkILh3SuusY-AM_6w/exec";
const URL_TOPPING = "https://script.google.com/macros/s/AKfycbyM12tfLEepRV-MBUgx7cgXTfhKFw13SlRgqrwLq13ffy379ONVTf4ReMMrxsY7aUj-Xw/exec";
const URL_CEMILAN = "https://script.google.com/macros/s/AKfycbzxC2d2S-GuWQ0EkpEd0bqowoC8XBt2g7VmX715WF94o88Rs7L49ktbcgVBfZyDwWkXOw/exec";
const ORDER_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbyqTSj7Vz2BXsIyzVeaqhMyTzbZ12eleQVvOJqGujdifSSGw_LLHiXm6cZPXjkAkoZ7DA/exec";

/* DATA MENU */
let menus = { seblak: [], minuman: [], topping: [], cemilan: [] };
let cart = [];
let transactions = JSON.parse(localStorage.getItem('saluyu_orders')) || [];

/* =========================
   LOAD AWAL
========================= */
window.onload = async () => {
    try {
        // Menggunakan Promise.all agar loading barengan dan lebih cepat
        const [resSeblak, resMinuman, resTopping, resCemilan] = await Promise.all([
            fetch(URL_SEBLAK).then(r => r.json()),
            fetch(URL_MINUMAN).then(r => r.json()),
            fetch(URL_TOPPING).then(r => r.json()),
            fetch(URL_CEMILAN).then(r => r.json())
        ]);

        menus.seblak = resSeblak;
        menus.minuman = resMinuman;
        menus.topping = resTopping;
        menus.cemilan = resCemilan;

        renderMenu('seblak'); // Render kategori pertama setelah loading selesai
    } catch (error) {
        console.error("Gagal memuat data:", error);
        alert("Gagal mengambil data dari Google Sheets. Pastikan koneksi internet stabil.");
    }
};

/* =========================
   NAVIGASI 
========================= */
function showPage(pageId) {
    if (pageId === 'admin') {
        const password = prompt("Masukkan Password Admin:");
        if (password !== "dhamarganteng") {
            alert("Akses ditolak!");
            return;
        }
    }

    document.querySelectorAll('section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(n => n.classList.remove('active'));

    document.getElementById(pageId + '-page').classList.add('active');
    document.getElementById('nav-' + pageId).classList.add('active');

    if (pageId === 'history') renderHistory();
}

/* =========================
   MENU 
========================= */
function renderMenu(type, btn = null) {
    if (btn) {
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    
    if (!menus[type] || menus[type].length === 0) {
        container.innerHTML = '<p class="text-center">Memuat menu...</p>';
        return;
    }

    menus[type].forEach((m, i) => {
        container.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm border-0">
                    <img src="${m.foto || m.img}" class="card-img-top" style="height:150px; object-fit:cover;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="fw-bold">${m.nama || m.name}</h6>
                        <p class="text-danger fw-bold">Rp ${Number(m.harga || m.price).toLocaleString('id-ID')}</p>
                        <button class="btn mt-auto" style="background-color: #faf9f9; color: #111111; font-weight: bold;" onclick="addToCart('${type}', ${i})">
                            Tambah
                        </button>
                    </div>
                </div>
            </div>`;
    });
}

/* =========================
   CART 
========================= */
function addToCart(type, index) {
    const item = menus[type][index];
    cart.push(item);
    updateCart();
}

function updateCart() {
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('total-price');

    list.innerHTML = '';
    let total = 0;

    cart.forEach((i, idx) => {
        const harga = Number(i.harga || i.price);
        total += harga;
        list.innerHTML += `
            <div class="d-flex justify-content-between small border-bottom pb-1 mb-1">
                <span>${i.nama || i.name}</span>
                <div>
                    <b>Rp ${harga.toLocaleString('id-ID')}</b>
                    <i class="bi bi-x-circle text-danger ms-2" style="cursor:pointer" onclick="removeFromCart(${idx})"></i>
                </div>
            </div>`;
    });

    totalEl.innerText = 'Rp ' + total.toLocaleString('id-ID');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}
/* =========================
   CHECKOUT 
========================= */
function openCheckout() {
    const name = document.getElementById('customer-name').value;
    if (!name || cart.length === 0) {
        alert("Lengkapi nama & pesanan!");
        return;
    }

    const total = cart.reduce((s, i) => s + Number(i.harga || i.price), 0);

    document.getElementById('modal-cust-name').innerText = name;
    document.getElementById('modal-total').innerText = 'Rp ' + total.toLocaleString('id-ID');
    
    
    document.getElementById('qr-img').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=SALUYU-${name}-${total}`;

    const payModal = new bootstrap.Modal(document.getElementById('payModal'));
    payModal.show();
}


/* =========================
   FINISH & SEND 
========================= */
function finishOrder() {
    const name = document.getElementById('customer-name').value;
    const total = cart.reduce((s, i) => s + Number(i.harga || i.price), 0);
    const itemNames = cart.map(i => i.nama || i.name).join(', ');

    const order = {
        id: 'SLY' + Date.now().toString().slice(-4),
        date: new Date().toLocaleString('id-ID'),
        customer: name,
        items: itemNames,
        total: total
    };

    
    const data = new URLSearchParams();
    data.append("id", order.id);
    data.append("date", order.date);
    data.append("customer", order.customer);
    data.append("items", order.items);
    data.append("total", order.total);

    fetch(ORDER_SCRIPT_URL, { method: "POST", mode: "no-cors", body: data });

    
    transactions.unshift(order);
    localStorage.setItem('saluyu_orders', JSON.stringify(transactions));

    
    cart = [];
    document.getElementById('customer-name').value = '';
    updateCart();

    bootstrap.Modal.getInstance(document.getElementById('payModal')).hide();
    alert("Pesanan berhasil dikirim!");
    showPage('history');
}

function renderHistory() {
    const table = document.getElementById('history-table');
    table.innerHTML = '';

    if (transactions.length === 0) {
        table.innerHTML = '<tr><td colspan="6" class="text-center">Belum ada data</td></tr>';
        return;
    }

    transactions.forEach(t => {
        table.innerHTML += `
            <tr>
                <td>#${t.id}</td>
                <td>${t.date}</td>
                <td>${t.customer}</td>
                <td>${t.items}</td>
                <td class="text-danger fw-bold">Rp ${Number(t.total).toLocaleString('id-ID')}</td>
                <td><span class="badge bg-success">Selesai</span></td>
            </tr>`;
    });
}
/* =========================
   CART 
========================= */
function addToCart(type, index) {
    const item = menus[type][index];
    cart.push(item);
    updateCart();
}

function updateCart() {
    const list = document.getElementById('cart-list');
    const totalEl = document.getElementById('total-price');

    list.innerHTML = '';
    let total = 0;

    cart.forEach((i, idx) => {
        const harga = Number(i.harga || i.price);
        total += harga;
        list.innerHTML += `
            <div class="d-flex justify-content-between small border-bottom pb-1 mb-1">
                <span>${i.nama || i.name}</span>
                <div>
                    <b>Rp ${harga.toLocaleString('id-ID')}</b>
                    <i class="bi bi-x-circle text-danger ms-2" style="cursor:pointer" onclick="removeFromCart(${idx})"></i>
                </div>
            </div>`;
    });

    totalEl.innerText = 'Rp ' + total.toLocaleString('id-ID');
}

function removeFromCart(index) {
    cart.splice(index, 1);
    updateCart();
}
/* =========================
   MENU 
========================= */
function renderMenu(type, btn = null) {
    if (btn) {
        document.querySelectorAll('.btn-filter').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
    }

    const container = document.getElementById('menu-container');
    container.innerHTML = '';

    
    if (!menus[type] || menus[type].length === 0) {
        container.innerHTML = '<p class="text-center">Memuat menu...</p>';
        return;
    }

    menus[type].forEach((m, i) => {
        container.innerHTML += `
            <div class="col">
                <div class="card h-100 shadow-sm border-2">
                    <img src="${m.foto || m.img}" class="card-img-top" style="height:150px; object-fit:cover;">
                    <div class="card-body d-flex flex-column">
                        <h6 class="fw-bold">${m.nama || m.name}</h6>
                        <p class="text-danger fw-bold">Rp ${Number(m.harga || m.price).toLocaleString('id-ID')}</p>
                        <button class="btn mt-auto" style="background-color: #050505; color: #faf8f8; font-weight: bold;" onclick="addToCart('${type}', ${i})">
                            Tambah
                        </button>
                    </div>
                </div>
            </div>`;
    });
}
