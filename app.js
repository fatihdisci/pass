/* VaultX - Premium Password Manager Logic */

const AppState = {
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
    }
};

// UI & Logic Controller
window.vaultApp = {
    async init() {
        // Listen for auth state changes (e.g. returning from email confirmation)
        window.supabaseClient.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session) {
                // We don't have the encryption key upon email link click,
                // so we force them to login manually to capture the passphrase.
                window.supabaseClient.auth.signOut();
                this.switchScreen('login');
                this.showToast("E-posta onaylandı! Lütfen giriş yapın.");
            }
        });

        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session) {
            await window.supabaseClient.auth.signOut(); // Force login to get decryption key
        }
        this.switchScreen('login');
    },

    switchScreen(screenId) {
        document.querySelectorAll('.screen').forEach(s => {
            s.classList.remove('active');
        });
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
        const email = document.getElementById('setup-email').value;
        const p1 = document.getElementById('setup-pass').value;
        const p2 = document.getElementById('setup-pass-confirm').value;

        if (!email) return this.showToast("E-posta adresi gerekli!", true);
        if (!p1 || p1.length < 6) return this.showToast("Şifre en az 6 karakter olmalı!", true);
        if (p1 !== p2) return this.showToast("Şifreler eşleşmiyor!", true);

        const btn = document.getElementById('btn-setup');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const { data, error } = await window.supabaseClient.auth.signUp({
            email: email,
            password: p1,
            options: {
                emailRedirectTo: window.location.origin + window.location.pathname
            }
        });

        btn.disabled = false;
        btn.innerHTML = '<span>Kasayı Oluştur</span><i class="fa-solid fa-arrow-right"></i>';

        if (error) {
            return this.showToast("Kayıt hatası: " + error.message, true);
        }

        document.getElementById('setup-email').value = '';
        document.getElementById('setup-pass').value = '';
        document.getElementById('setup-pass-confirm').value = '';

        // Supabase requires email confirmation by default.
        if (data.user && data.user.identities && data.user.identities.length === 0) {
            return this.showToast("Bu e-posta zaten kullanımda!", true);
        }

        this.switchScreen('login');
        this.showToast("Kayıt başarılı! Lütfen e-postanızı onaylayın veya giriş yapın.");
    },

    async unlockVault() {
        const email = document.getElementById('login-email').value;
        const pass = document.getElementById('login-pass').value;

        if (!email || !pass) return this.showToast("E-posta ve şifre gerekli!", true);

        const btn = document.getElementById('btn-login');
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

        const { data, error } = await window.supabaseClient.auth.signInWithPassword({
            email: email,
            password: pass
        });

        btn.disabled = false;
        btn.innerHTML = '<span>Kilidi Aç</span><i class="fa-solid fa-unlock"></i>';

        if (error) {
            return this.showToast("Giriş hatası: " + (error.message.includes('Invalid') ? 'Yanlış e-posta veya şifre!' : error.message), true);
        }

        AppState.sessionKey = pass;
        document.getElementById('login-email').value = '';
        document.getElementById('login-pass').value = '';

        this.switchScreen('dashboard');
        this.loadVault();
    },

    async lockVault() {
        AppState.sessionKey = null;
        AppState.vaultData = [];
        document.getElementById('vault-list').innerHTML = '';
        await window.supabaseClient.auth.signOut();
        this.switchScreen('login');
        this.showToast("Kasa kilitlendi.");
    },

    async loadVault() {
        const { data: { user } } = await window.supabaseClient.auth.getUser();
        if (!user) return this.lockVault();

        const { data: items, error } = await window.supabaseClient
            .from('vault_items')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error(error);
            return this.showToast("Veriler yüklenirken hata oluştu!", true);
        }

        AppState.vaultData = [];
        for (let item of items) {
            const decStr = await CryptoEngine.decrypt(item.encrypted_data, AppState.sessionKey);
            if (decStr) {
                try {
                    const decObj = JSON.parse(decStr);
                    AppState.vaultData.push({
                        id: item.id,
                        title: item.title,
                        user: decObj.u,
                        pass: decObj.p
                    });
                } catch (e) {
                    console.error("Parse error on item", item.id);
                }
            } else {
                console.error("Decryption failed for item", item.id);
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

        const { data: userData } = await window.supabaseClient.auth.getUser();
        if (!userData || !userData.user) return this.showToast("Oturum süresi dolmuş!", true);

        const { error } = await window.supabaseClient
            .from('vault_items')
            .insert({
                user_id: userData.user.id,
                title: title,
                encrypted_data: encrypted
            });

        if (error) {
            console.error(error);
            return this.showToast("Kayıt eklenirken hata: " + error.message, true);
        }

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

    async deletePassword(id) {
        if (confirm("Bu kaydı silmek istediğinize emin misiniz?")) {
            const { error } = await window.supabaseClient
                .from('vault_items')
                .delete()
                .eq('id', id);

            if (error) {
                console.error(error);
                return this.showToast("Kayıt silinirken hata oluştu!", true);
            }

            this.closeViewModal();
            this.loadVault();
            this.showToast("Kayıt silindi.");
        }
    }
};

window.addEventListener('load', () => window.vaultApp.init());
