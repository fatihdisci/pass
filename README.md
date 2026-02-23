# 🔐 VaultX - Premium Password Manager

VaultX is a high-security, professional grade Progressive Web App (PWA) designed to manage your passwords with peace of mind. Built with a focus on privacy, aesthetics, and cloud synchronization.

![VaultX Screenshot](https://raw.githubusercontent.com/fatihdisci/pass/main/icon.png)

## 🛡️ Security Architecture (Zero-Knowledge)

VaultX operates on a **Zero-Knowledge** principle. Your security is our highest priority.

*   **AES-256 Encryption:** All your data is encrypted locally on your device using the industry-standard Advanced Encryption Standard (AES-256-GCM).
*   **End-to-End Privacy:** Data is encrypted *before* it leaves your device. Supabase (our cloud provider) never sees your raw passwords; it only stores encrypted, unreadable strings.
*   **Master Password Authority:** Your Master Password is the only key. It is never stored on any server or in local storage. It exists only in your memory and the app's volatile RAM during your session.
*   **Supabase Row Level Security (RLS):** Even if the database is accessed, Supabase's internal security policies ensure that users can only interact with their own encrypted data slices.

## ✨ Features

*   **Cloud Sync:** Access your vault from any device using Supabase integration.
*   **Modern UI:** A stunning glassmorphism design with fluid animations and dynamic backgrounds.
*   **Mobile Optimized:** Responsive design using `dvh` units and GPU-friendly effects for a smooth mobile experience.
*   **Password Generator:** Create strong, cryptographically secure passwords with a single click.
*   **PWA Ready:** Install it on your phone or desktop for a native-app feel.
*   **Quick Search:** Filter through your vault instantly.

## 🚀 Tech Stack

-   **Frontend:** HTML5, Vanilla CSS, JavaScript (ES6+)
-   **Backend/Auth:** [Supabase](https://supabase.com/)
-   **Security:** [CryptoJS](https://cryptojs.gitbook.io/docs/)
-   **Icons:** FontAwesome 6

## 🛠️ Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/fatihdisci/pass.git
    ```
2.  **Supabase Configuration:**
    Create a `vault_items` table in your Supabase SQL Editor:
    ```sql
    create table vault_items (
      id uuid default gen_random_uuid() primary key,
      user_id uuid references auth.users not null,
      title text not null,
      encrypted_data text not null,
      created_at timestamp with time zone default timezone('utc'::text, now()) not null
    );
    alter table vault_items enable row level security;
    -- Set up your RLS policies for Select/Insert/Delete based on auth.uid()
    ```
3.  **Update Credentials:**
    Update `supabase.js` with your Project URL and Anon Key.

---
Built with ❤️ by [Fatih Dişçi](https://github.com/fatihdisci)
