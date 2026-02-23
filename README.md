# 🔐 VaultX - Premium Password Manager

VaultX, modern web teknolojileri ile geliştirilmiş, estetik ve güvenliği ön planda tutan profesyonel bir şifre yöneticisi (PWA) çözümüdür. Tarayıcı tabanlı çalışmasına rağmen askeri düzeyde şifreleme ile verilerinizi güvence altına alır.

🚀 **[Canlı Demo İçin Tıklayın](https://fatihdisci.github.io/pass/)**

---

## ✨ Özellikler

- 💎 **Premium Tasarım**: Obsidian & Glassmorphism temelli, akıcı animasyonlara sahip modern arayüz.
- 🛡️ **Üst Düzey Güvenlik**: Web Crypto API kullanılarak implemente edilmiş **AES-256-GCM** şifreleme ve **PBKDF2** key-derivation algoritması.
- 📱 **PWA Desteği**: Uygulama olarak cihaza yüklenebilir ve offline (çevrimdışı) çalışabilir.
- ⚡ **Hızlı Performans**: Modüler JS yapısı ve optimize edilmiş CSS animasyonları.
- 🎲 **Şifre Üretici**: Güçlü ve güvenli şifreler oluşturmak için dahili şifre üretim aracı.

## 🛠️ Kullanılan Teknolojiler

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Glassmorphism), JavaScript (ES6+)
- **Güvenlik**: standard Web Crypto API (AES-GCM, SHA-256, PBKDF2)
- **İkonlar**: FontAwesome 6
- **Fontlar**: Google Fonts (Outfit)
- **PWA**: Service Worker & Web App Manifest

## 🔒 Güvenlik Notu

VaultX "Zero-Knowledge" prensibiyle çalışır. Ana şifreniz hiçbir yere gönderilmez; tüm şifreleme ve çözme işlemleri doğrudan tarayıcınızda gerçekleşir. Verileriniz yerel depolama alanında şifreli olarak saklanır.

## 📦 Kurulum ve Çalıştırma

Projeyi yerelinizde çalıştırmak için dosyaları indirmeniz ve herhangi bir HTTP sunucusu üzerinden açmanız yeterlidir (veya GitHub Pages üzerinden doğrudan erişebilirsiniz).

```bash
# Örnek Python HTTP sunucusu
python -m http.server 8080
```

---
Geliştiren: [Fatih Dişçi](https://github.com/fatihdisci)
