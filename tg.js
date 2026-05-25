<script>
let tg = null;
try { tg = window.Telegram?.WebApp || null; if(tg){tg.expand();tg.ready();} } catch(e){}

let navigationHistory = ['home'];
let isAdminLoggedIn = false;

// ВАЖНО: Замените на ваш реальный Telegram ID
const MY_ADMIN_ID = 5273703401; 

// Проверяем, является ли текущий пользователь админом
function isUserAdmin() {
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        return tg.initDataUnsafe.user.id === MY_ADMIN_ID;
    }
    return false;
}

// История заказов (загружаем из localStorage)
function getPurchaseHistory() {
    const history = localStorage.getItem('purchaseHistory');
    return history ? JSON.parse(history) : [];
}

function savePurchaseHistory(history) {
    localStorage.setItem('purchaseHistory', JSON.stringify(history));
}

let currentLang = 'uz';
let pendingBuy = {};
let selectedPremium = null;
let currentFilter = 'all';

function setLang(lang) {
    currentLang = lang;
    const langNames = { uz: "O'zbek", ru: 'Русский', en: 'English' };
    document.getElementById('lang-sub').textContent = langNames[lang];
    document.querySelectorAll('#sheet-lang .option-item').forEach(o => o.classList.remove('selected'));
    document.getElementById('lang-' + lang).classList.add('selected');
    setTimeout(closeSheet, 300);
}

function loadUserData() {
    let name='Arena X User', handle='@username', initials='AX', photo=null, uid='0000000000';
    if (tg?.initDataUnsafe?.user) {
        const u = tg.initDataUnsafe.user;
        const f = u.first_name||'', l = u.last_name||'';
        name = (f+' '+l).trim() || name;
        handle = u.username ? '@'+u.username : handle;
        initials = (f[0]||(l[0]||'U')).toUpperCase();
        if (u.photo_url) photo = u.photo_url;
        uid = String(u.id)||uid;
    }
    ['home-name','profil-name'].forEach(id => { const el=document.getElementById(id); if(el) el.textContent=name; });
    document.getElementById('home-handle').textContent = handle;
    document.getElementById('profil-id').textContent = uid;
    ['home-avatar','profil-avatar'].forEach(id => {
        const el = document.getElementById(id); if(!el) return;
        const dot = el.querySelector('.online-dot');
        el.innerHTML = '';
        if (photo) { const img=document.createElement('img'); img.src=photo; img.alt='avatar'; el.appendChild(img); }
        else { el.appendChild(document.createTextNode(initials)); }
        if (dot) el.appendChild(dot);
    });
}
loadUserData();

(function(){
    const c = document.getElementById('stars');
    for(let i=0;i<60;i++){
        const s=document.createElement('div'); s.className='star';
        s.style.cssText=`left:${Math.random()*100}%;top:${Math.random()*100}%;--dur:${2+Math.random()*4}s;animation-delay:${Math.random()*4}s;`;
        c.appendChild(s);
    }
})();

let currentSlide = 0;
const slides = document.querySelectorAll('.carousel-slide');
const dots = document.querySelectorAll('.carousel-dot');
function nextSlide() {
    slides[currentSlide].classList.remove('active');
    dots[currentSlide].classList.remove('active');
    currentSlide = (currentSlide + 1) % slides.length;
    slides[currentSlide].classList.add('active');
    dots[currentSlide].classList.add('active');
}
setInterval(nextSlide, 5000);

function switchPage(name, el) {
    if (navigationHistory[navigationHistory.length - 1] !== name) {
        navigationHistory.push(name);
    }
    
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('page-'+name).classList.add('active');
    if(el && el.classList.contains('nav-item')) el.classList.add('active');
    else document.querySelector('.nav-item').classList.add('active');
    
    if (name === 'tarix') loadHistory();
    if (name === 'admin') checkAdminAuth();
}

function openGamePage(game) {
    navigationHistory.push(game);
    document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
    document.getElementById('page-'+game).classList.add('active');
}

function goBack() {
    if (navigationHistory.length > 1) {
        navigationHistory.pop();
        const previousPage = navigationHistory[navigationHistory.length - 1];
        document.querySelectorAll('.page').forEach(p=>p.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n=>n.classList.remove('active'));
        document.getElementById('page-'+previousPage).classList.add('active');
        const navMapping = { 'home': 0, 'hamyon': 1, 'oyinlar': 2, 'tarix': 3, 'profil': 4 };
        if (navMapping[previousPage] !== undefined) {
            document.querySelectorAll('.nav-item')[navMapping[previousPage]].classList.add('active');
        }
    }
}

// ADMIN FUNCTIONS
function checkAdminAuth() {
    // Проверяем, является ли пользователь админом
    if (!isUserAdmin()) {
        alert('❌ Siz admin emassiz! Kirish taqiqlangan.');
        goBack();
        return;
    }
    
    if (!isAdminLoggedIn) {
        document.getElementById('admin-login').style.display = 'block';
        document.getElementById('admin-dashboard').style.display = 'none';
    } else {
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        updateAdminStats();
        loadAdminOrders();
    }
}

function loginAdmin() {
    const password = document.getElementById('admin-password').value;
    // Простая проверка пароля (можно усложнить)
    if (password === 'admin123') {
        isAdminLoggedIn = true;
        document.getElementById('admin-login').style.display = 'none';
        document.getElementById('admin-dashboard').style.display = 'block';
        updateAdminStats();
        loadAdminOrders();
    } else {
        alert('Noto\'g\'ri parol!');
    }
}

function logoutAdmin() {
    isAdminLoggedIn = false;
    document.getElementById('admin-password').value = '';
    goBack();
}

function updateAdminStats() {
    const history = getPurchaseHistory();
    document.getElementById('total-orders').textContent = history.length;
    document.getElementById('pending-orders').textContent = history.filter(o => o.status === 'pending').length;
    document.getElementById('success-orders').textContent = history.filter(o => o.status === 'success').length;
    
    const totalRevenue = history
        .filter(o => o.status === 'success')
        .reduce((sum, o) => sum + parseInt(o.price.replace(/\s/g, '').replace(' UZS', '')), 0);
    document.getElementById('total-revenue').textContent = totalRevenue.toLocaleString();
}

function loadAdminOrders() {
    const ordersList = document.getElementById('admin-orders-list');
    ordersList.innerHTML = '';
    const history = getPurchaseHistory();
    
    if (history.length === 0) {
        ordersList.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><div class="empty-text">Buyurtmalar yo\'q</div></div>';
        return;
    }
    
    history.forEach(order => {
        const statusClass = order.status === 'success' ? 'status-success' : 
                           order.status === 'pending' ? 'status-pending' : 'status-error';
        const statusText = order.status === 'success' ? '✅ Muvaffaqiyatli' : 
                          order.status === 'pending' ? '⏳ Kutishda' : '❌ Xato';
        
        const orderItem = document.createElement('div');
        orderItem.className = 'order-item';
        orderItem.innerHTML = `
            <div class="order-header">
                <div>
                    <div style="font-weight:600;color:var(--text);">${order.game}</div>
                    <div style="font-size:12px;color:var(--muted);">${order.package}</div>
                </div>
                <div class="history-status ${statusClass}">${statusText}</div>
            </div>
            <div style="display:flex;justify-content:space-between;margin-top:8px;">
                <div style="font-size:12px;color:var(--muted);">ID: ${order.playerId}</div>
                <div style="font-family:'Rajdhani',sans-serif;font-weight:700;color:var(--primary-light);">${order.price}</div>
            </div>
            <div style="font-size:11px;color:var(--muted);margin-top:4px;">${order.date}</div>
            <div style="font-size:11px;color:var(--muted);margin-top:2px;">👤 @${order.username || 'unknown'}</div>
            ${order.status === 'pending' ? `
                <div class="order-actions">
                    <button class="order-btn order-btn-success" onclick="updateOrderStatus(${order.id}, 'success')">✅ Tasdiqlash</button>
                    <button class="order-btn order-btn-error" onclick="updateOrderStatus(${order.id}, 'error')">❌ Rad etish</button>
                </div>
            ` : ''}
        `;
        ordersList.appendChild(orderItem);
    });
}

function updateOrderStatus(orderId, newStatus) {
    let history = getPurchaseHistory();
    const order = history.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        savePurchaseHistory(history);
        updateAdminStats();
        loadAdminOrders();
        alert(newStatus === 'success' ? 'Buyurtma tasdiqlandi!' : 'Buyurtma rad etildi!');
    }
}

function openAdmin() {
    // Проверяем права перед открытием
    if (!isUserAdmin()) {
        alert('❌ Siz admin emassiz! Kirish taqiqlangan.');
        return;
    }
    switchPage('admin');
}

function loadHistory() {
    filterHistory(currentFilter);
}

function filterHistory(filter, el) {
    currentFilter = filter;
    if (el) {
        document.querySelectorAll('.history-filter').forEach(f => f.classList.remove('active'));
        el.classList.add('active');
    }
    
    const historyList = document.getElementById('history-list');
    historyList.innerHTML = '';
    
    let history = getPurchaseHistory();
    let filteredHistory = history;
    if (filter !== 'all') {
        filteredHistory = history.filter(item => item.status === filter);
    }
    
    if (filteredHistory.length === 0) {
        historyList.innerHTML = `<div class="empty-state"><div class="empty-icon">📋</div><div class="empty-text">Ma'lumot topilmadi</div><div class="empty-sub">Hozircha hech narsa yo'q</div></div>`;
        return;
    }
    
    filteredHistory.forEach(item => {
        const statusClass = item.status === 'success' ? 'status-success' : 
                           item.status === 'pending' ? 'status-pending' : 'status-error';
        const statusText = item.status === 'success' ? '✅ Muvaffaqiyatli' : 
                          item.status === 'pending' ? '⏳ Kutishda' : '❌ Xato';
        
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        historyItem.innerHTML = `
            <div class="history-item-header">
                <div class="history-game-name">${item.game}</div>
                <div class="history-status ${statusClass}">${statusText}</div>
            </div>
            <div class="history-item-details">
                <div class="history-package">${item.package}</div>
                <div class="history-price">${item.price}</div>
            </div>
            <div class="history-date">${item.date} • ID: ${item.playerId}</div>
        `;
        historyList.appendChild(historyItem);
    });
}

function showPUBGTab(tabName) {
    document.getElementById('pubg-ucvoucher').style.display = tabName === 'ucvoucher' ? 'block' : 'none';
    document.getElementById('pubg-royalpass').style.display = tabName === 'royalpass' ? 'block' : 'none';
    document.getElementById('pubg-promocod').style.display = tabName === 'promocod' ? 'block' : 'none';
    document.querySelectorAll('#page-pubg .game-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function showMLBBTab(tabName) {
    document.querySelectorAll('#page-mlbb .packages-grid').forEach(grid => grid.style.display = 'none');
    document.getElementById('mlbb-'+tabName).style.display = 'grid';
    document.querySelectorAll('#page-mlbb .game-tab').forEach(tab => tab.classList.remove('active'));
    event.target.classList.add('active');
}

function ripple(el, e) {
    const r=document.createElement('span'); r.className='ripple';
    const rect=el.getBoundingClientRect();
    const sz=Math.max(rect.width,rect.height)*2;
    r.style.cssText=`width:${sz}px;height:${sz}px;left:${(e.clientX-rect.left)-sz/2}px;top:${(e.clientY-rect.top)-sz/2}px;`;
    el.appendChild(r); r.addEventListener('animationend',()=>r.remove());
}

let currentSheet = null;
function openSheet(id) {
    if (currentSheet) document.getElementById(currentSheet).classList.remove('open');
    currentSheet = id;
    document.getElementById('overlay').classList.add('open');
    document.getElementById(id).classList.add('open');
}
function closeSheet() {
    document.getElementById('overlay').classList.remove('open');
    if (currentSheet) { document.getElementById(currentSheet).classList.remove('open'); currentSheet=null; }
}

function topupBalance(e, btn) {
    ripple(btn, e);
    setTimeout(() => openSheet('sheet-topup'), 80);
}
function doTopup(val) {
    closeSheet();
    if (tg) tg.sendData(`Topup|Balance|${val}|UserBalance`);
    else alert('Topup: '+val+' UZS (demo)');
}

function buyPackage(game, packageName, price) {
    pendingBuy = { game, packageName, price };
    const icons = { 'PUBG': '🪖', 'MLBB': '⚔️', 'FREEFIRE': '🔥', 'STANDOFF': '🎯', 'TELEGRAM': '⭐' };
    document.getElementById('buy-package-icon').textContent = icons[game] || '💎';
    document.getElementById('buy-package-name').textContent = packageName;
    document.getElementById('buy-package-price').textContent = parseInt(price).toLocaleString() + ' UZS';
    document.getElementById('player-id-input').value = '';
    openSheet('sheet-buy');
}

function confirmBuy() {
    const playerId = document.getElementById('player-id-input').value.trim();
    if (!playerId) { 
        alert('ID kiriting!'); 
        return; 
    }
    
    closeSheet();
    
    // Получаем данные пользователя
    let username = 'unknown';
    let userId = 0;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        username = tg.initDataUnsafe.user.username || `user_${tg.initDataUnsafe.user.id}`;
        userId = tg.initDataUnsafe.user.id;
    }
    
    // Формируем сообщение для бота
    const msg = `${pendingBuy.game}|${pendingBuy.packageName}|${pendingBuy.price}|${playerId}`;
    
    // Отправляем данные боту
    if (tg) {
        tg.sendData(msg);
    } else {
        alert('Данные отправлены боту: ' + msg);
    }
    
    // Сохраняем в локальную историю
    let history = getPurchaseHistory();
    const newPurchase = {
        id: Date.now(),
        user_id: userId,
        username: username,
        game: pendingBuy.game,
        package: pendingBuy.packageName,
        price: parseInt(pendingBuy.price).toLocaleString() + ' UZS',
        status: 'pending',
        date: new Date().toLocaleString('uz-UZ'),
        playerId: playerId
    };
    history.unshift(newPurchase);
    savePurchaseHistory(history);
    
    // Показываем подтверждение
    alert('✅ Buyurtma qabul qilindi! Operator tez orada aloqaga chiqadi.');
}

function checkUsername() {
    const username = document.getElementById('tg-username').value.trim();
    if (!username) { alert('Username kiriting!'); return; }
    alert('Username tekshirildi: ' + username);
}

function selectPremium(el, duration, price) {
    document.querySelectorAll('.premium-option').forEach(opt => opt.classList.remove('selected'));
    el.classList.add('selected');
    selectedPremium = { duration, price };
    document.getElementById('buy-premium-btn').disabled = false;
}

function buyPremium() {
    if (!selectedPremium) return;
    const username = document.getElementById('tg-username').value.trim();
    if (!username) { alert('Username kiriting!'); return; }
    
    closeSheet();
    
    let userId = 0;
    if (tg && tg.initDataUnsafe && tg.initDataUnsafe.user) {
        userId = tg.initDataUnsafe.user.id;
    }
    
    const msg = `TELEGRAM|Premium ${selectedPremium.duration}|${selectedPremium.price}|${username}`;
    
    if (tg) {
        tg.sendData(msg);
    } else {
        alert('Данные отправлены боту: ' + msg);
    }
    
    let history = getPurchaseHistory();
    const newPurchase = {
        id: Date.now(),
        user_id: userId,
        username: username,
        game: 'Telegram Premium',
        package: 'Premium ' + selectedPremium.duration,
        price: parseInt(selectedPremium.price).toLocaleString() + ' UZS',
        status: 'pending',
        date: new Date().toLocaleString('uz-UZ'),
        playerId: username
    };
    history.unshift(newPurchase);
    savePurchaseHistory(history);
    
    alert('✅ Buyurtma qabul qilindi!');
}

function openLang() { openSheet('sheet-lang'); }
function openSupport() { openSheet('sheet-support'); }
function callPhone() {
    closeSheet();
    if (tg) tg.openLink('tel:+998905890192');
    else window.location.href='tel:+998905890192';
}
function openTelegram() {
    closeSheet();
    if (tg) tg.openTelegramLink('https://t.me/barbossa_gaming');
    else window.open('https://t.me/barbossa_gaming','_blank');
}
function openAbout() { openSheet('sheet-about'); }
function openCurrency() { openSheet('sheet-currency'); }
function setCurrency(code, label) {
    document.querySelectorAll('#sheet-currency .option-item').forEach(o=>o.classList.remove('selected'));
    document.getElementById('cur-'+code.toLowerCase()).classList.add('selected');
    document.getElementById('currency-sub').textContent = label;
    setTimeout(closeSheet, 300);
}

function openChannel() {
    const channelUrl = 'https://t.me/ВАШ_КАНАЛ';
    if (tg) tg.openTelegramLink(channelUrl);
    else window.open(channelUrl, '_blank');
}

function openTelegramSupport() {
    if (tg) tg.openTelegramLink('https://t.me/barbossa_gaming');
    else window.open('https://t.me/barbossa_gaming', '_blank');
}
</script>