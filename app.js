/* VaultX - Premium Password Manager Logic */

const AppState = {
    masterHash: localStorage.getItem('vaultx_master'),
    sessionKey: null,
    vaultData: []
};

// Cryptography Engine (CryptoJS for universal support including file:// protocol)
const CryptoEngine = {
    async encrypt(text, password) {
        return CryptoJS.AES.encrypt(text, password).toString();
    },

    async decrypt(encryptedStr, password) {
        try {
            const bytes = CryptoJS.AES.decrypt(encryptedStr, password);
            const decrypted = bytes.toString(CryptoJS.enc.Utf8);
            if (!decrypted) throw new Error("Mismatched password or corrupted data");
            return decrypted;
        } catch (e) {
            console.error("Decryption failed", e);
            return null;
        }
    },

    async hashMaster(password) {
        return CryptoJS.SHA256(password).toString();
    }
};

// UI & Logic Controller
window.vaultApp = {
    init() {
        if (AppState.masterHash) this.switchScreen('login');
        else this.switchScreen('setup');
    },

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        setTimeout(() => {
            const screen = document.getElementById(`${screenId}-screen`);
            if (screen) screen.classList.add('active');
        }, 50);
    },

    showToast(msg, isError = false) {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('.toast-icon i');
        const msgEl = document.getElementById('toast-msg');

        msgEl.innerText = msg;
        if (isError) {
            toast.classList.add('error');
            icon.className = 'fa-solid fa-xmark';
        } else {
            toast.classList.remove('error');
            icon.className = 'fa-solid fa-check';
        }

        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 3000);
    },

    async setMasterPassword() {
        const p1 = document.getElementById('setup-pass').value;
        const p2 = document.getElementById('setup-pass-confirm').value;

        if (!p1 || p1.length < 6) return this.showToast("Şifre en az 6 karakter olmalı!", true);
        if (p1 !== p2) return this.showToast("Şifreler eşleşmiyor!", true);

        const hash = await CryptoEngine.hashMaster(p1);
        localStorage.setItem('vaultx_master', hash);
        AppState.masterHash = hash;
        AppState.sessionKey = p1;

        document.getElementById('setup-pass').value = '';
        document.getElementById('setup-pass-confirm').value = '';

        this.switchScreen('dashboard');
        this.loadVault();
        this.showToast("Kasa başarıyla oluşturuldu!");
    },

    async unlockVault() {
        const pass = document.getElementById('login-pass').value;
        if (!pass) return;

        const hash = await CryptoEngine.hashMaster(pass);
        if (hash === AppState.masterHash) {
            AppState.sessionKey = pass;
            document.getElementById('login-pass').value = '';
            this.switchScreen('dashboard');
            this.loadVault();
        } else {
            this.showToast("Yanlış şifre!", true);
        }
    },

    lockVault() {
        AppState.sessionKey = null;
        AppState.vaultData = [];
        document.getElementById('vault-list').innerHTML = '';
        this.switchScreen('login');
        this.showToast("Kasa kilitlendi.");
    },

    async loadVault() {
        const rawData = localStorage.getItem('vaultx_data');
        let parsed = [];
        if (rawData) {
            try { parsed = JSON.parse(rawData); } catch (e) { }
        }

        AppState.vaultData = [];
        for (let item of parsed) {
            // Check if item was encrypted with old XOR mechanism briefly
            // Old mechanism didn't combine u/p into JSON payload originally, it just encrypted the password.
            // Assuming clean slate or new records mostly for the rewrite.
            const decStr = await CryptoEngine.decrypt(item.enc, AppState.sessionKey);
            if (decStr) {
                try {
                    const decObj = JSON.parse(decStr);
                    AppState.vaultData.push({
                        id: item.id,
                        title: item.t,
                        user: decObj.u,
                        pass: decObj.p
                    });
                } catch (e) { }
            }
        }

        this.renderVault(AppState.vaultData);
        document.getElementById('total-passwords').innerText = AppState.vaultData.length;
    },

    renderVault(dataList) {
        const listEl = document.getElementById('vault-list');
        listEl.innerHTML = '';

        if (dataList.length === 0) {
            listEl.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-ghost"></i>
                    <p>Kasanız şu an boş.</p>
                </div>
            `;
            return;
        }

        dataList.forEach((item, index) => {
            const div = document.createElement('div');
            div.className = 'vault-item';
            div.style.animationDelay = `${index * 0.05}s`;
            div.onclick = () => this.openViewModal(item.id);

            const initial = item.title.charAt(0).toUpperCase();

            div.innerHTML = `
                <div class="item-icon">${initial}</div>
                <div class="item-info">
                    <h3>${item.title}</h3>
                    <p>${item.user}</p>
                </div>
                <i class="fa-solid fa-chevron-right item-chevron"></i>
            `;
            listEl.appendChild(div);
        });
    },

    filterVault() {
        const query = document.getElementById('search-input').value.toLowerCase();
        const filtered = AppState.vaultData.filter(item =>
            item.title.toLowerCase().includes(query) ||
            item.user.toLowerCase().includes(query)
        );
        this.renderVault(filtered);
    },

    openAddModal() {
        document.getElementById('new-title').value = '';
        document.getElementById('new-user').value = '';
        document.getElementById('new-pass').value = '';
        document.getElementById('add-modal').classList.add('active');
        setTimeout(() => document.getElementById('new-title').focus(), 100);
    },

    closeAddModal() {
        document.getElementById('add-modal').classList.remove('active');
    },

    generateRandomPassword() {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
        let pass = "";
        const randomValues = new Uint32Array(16);
        window.crypto.getRandomValues(randomValues);
        for (let i = 0; i < 16; i++) {
            pass += chars[randomValues[i] % chars.length];
        }
        document.getElementById('new-pass').value = pass;
    },

    async savePassword() {
        const title = document.getElementById('new-title').value;
        const user = document.getElementById('new-user').value;
        const pass = document.getElementById('new-pass').value;

        if (!title || !user || !pass) return;

        const payload = JSON.stringify({ u: user, p: pass });
        const encrypted = await CryptoEngine.encrypt(payload, AppState.sessionKey);

        let vault = JSON.parse(localStorage.getItem('vaultx_data') || '[]');
        vault.push({
            id: Date.now().toString(),
            t: title,
            enc: encrypted
        });

        localStorage.setItem('vaultx_data', JSON.stringify(vault));
        this.closeAddModal();
        this.loadVault();
        this.showToast("Kayıt başarıyla eklendi!");
    },

    currentViewId: null,

    openViewModal(id) {
        const item = AppState.vaultData.find(x => x.id === id);
        if (!item) return;

        this.currentViewId = id;
        document.getElementById('view-title').innerText = item.title;
        document.getElementById('view-user').innerText = item.user;
        document.getElementById('view-pass').value = item.pass;
        document.getElementById('view-pass').type = 'password';
        document.getElementById('toggle-view-pass').innerHTML = '<i class="fa-regular fa-eye"></i>';

        const deleteBtn = document.getElementById('btn-delete-record');
        deleteBtn.onclick = () => this.deletePassword(id);

        document.getElementById('view-modal').classList.add('active');
    },

    closeViewModal() {
        document.getElementById('view-modal').classList.remove('active');
        setTimeout(() => {
            document.getElementById('view-pass').value = '';
            document.getElementById('view-user').innerText = '---';
        }, 300);
    },

    togglePasswordVisibility(inputId) {
        const input = document.getElementById(inputId);
        const btn = document.getElementById(`toggle-${inputId}`);
        if (input.type === 'password') {
            input.type = 'text';
            btn.innerHTML = '<i class="fa-regular fa-eye-slash"></i>';
        } else {
            input.type = 'password';
            btn.innerHTML = '<i class="fa-regular fa-eye"></i>';
        }
    },

    copyField(elementId, isInput = false) {
        const el = document.getElementById(elementId);
        const text = isInput ? el.value : el.innerText;
        navigator.clipboard.writeText(text).then(() => {
            this.showToast("Panoya kopyalandı!");
        });
    },

    deletePassword(id) {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            let vault = JSON.parse(localStorage.getItem('vaultx_data') || '[]');
            vault = vault.filter(item => item.id !== id);
            localStorage.setItem('vaultx_data', JSON.stringify(vault));
            this.closeViewModal();
            this.loadVault();
            this.showToast("Kayıt silindi.");
        }
    }
};

window.addEventListener('load', () => window.vaultApp.init());
