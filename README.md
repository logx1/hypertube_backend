# HyperTube 🎬

HyperTube is a modern, high-performance, containerized microservices web application designed for discovering, searching, and streaming movies directly from torrents. The platform integrates instant video transcoding (including dual-stream capabilities: standard and 144p downscaled streams) and features a fully-featured user management system with multi-provider OAuth, multilingual support, and interactive social features like comments and viewing history.

---

## 🏗️ System Architecture

HyperTube is designed using a robust microservices architecture orchestrated with **Docker Compose**, with a secure **NGINX Reverse Proxy** acting as the single entry point.

```
                  ┌──────────────────────┐
                  │     Web Browser      │
                  └──────────┬───────────┘
                             │ (Ports 80 / 443 HTTPS)
                             ▼
                  ┌──────────────────────┐
                  │  NGINX Reverse Proxy │
                  └──────────┬───────────┘
                             │
     ┌───────────────────────┼───────────────────────┐
     ▼                       ▼                       ▼
┌──────────────┐       ┌──────────────┐       ┌──────────────┐
│  React App   │       │  Rails Auth  │       │ Django Movie │
│  (Frontend)  │       │  (Backend)   │       │  (Backend)   │
└──────────────┘       └──────┬───────┘       └──────┬───────┘
                              │                      │
                              └──────────┬───────────┘
                                         ▼
                                  ┌──────────────┐
                                  │  PostgreSQL  │
                                  │  (Database)  │
                                  └──────────────┘
```

### Services Breakdown:
1. **Frontend (React Router & TailwindCSS):** Located under `/frontend/my-react-app`. It handles user interface, language translations (English/French), state management, profiles, search filters, and video streaming players. Runs on port `3000` internally.
2. **Auth Service (Ruby on Rails API):** Located under `/auth`. Handles authentication, JWT creation/verification, user profiles, email dispatching (using Mailers for password resets), and multi-provider OAuth (42 Intra, Google, and GitHub). Runs on port `8001` internally.
3. **Movie Service (Django REST Framework):** Located under `/movies`. Handles searching the TMDb and YTS APIs, initializing background torrent downloads sequentially using **libtorrent**, tracking active downloads, and streaming/transcoding media files on-the-fly (with dynamic 144p transcoding via **FFmpeg**). Runs on port `8000` internally.
4. **Database (PostgreSQL 18):** Managed through an initialization schema `/init.sql` which provisions databases for both Rails and Django applications.
5. **Nginx Reverse Proxy:** Located at the root `/nginx.conf`. Redirects all HTTP traffic to HTTPS, serves SSL/TLS protocols securely, handles internal auth subrequests to guard protected video APIs, and directs client routes dynamically.

---

## ✨ Features

### 👤 User Authentication & Accounts
*   **Secure Sign In / Sign Up:** Full username and password credentials flow protected by secure bcrypt hashing.
*   **JWT Token-Based Authentication:** Clean cookie-based JWT token exchange between Rails and React.
*   **Interactive OAuth2 Sign-In:** One-click integration with:
    *   **Google OAuth**
    *   **GitHub OAuth**
    *   **42 Intra**
*   **Mailers & Password Recovery:** Secure "forgot password" workflows that generate self-signed reset tokens and send notification emails.
*   **Account Settings:** Modify user details (first name, last name, username, profile picture URL, language preference) or update email and password securely.

### 🔍 Discovery & Fuzzy Search
*   **TMDb Integration:** Browse trending popular movies, fetch rich descriptions, movie backdrops, and cast metadata (top 5 actors with profile images).
*   **YTS Torrent Indexing:** Seamless integration searching high-quality torrents.
*   **Fuzzy Search Sorting:** Results are dynamically sorted using string matching algorithms (difflib matching) against your search query.

### 🎥 High-Tech Torrent Streaming & On-the-Fly Transcoding
*   **Sequential Torrent Downloader:** Integrated background torrent worker in Python using `libtorrent` allowing you to start watching movies without waiting for the full download to complete.
*   **Dual Quality Stream (Default & 144p):**
    *   When a movie is requested, Django spawns a background thread to download the target file.
    *   Once download progress exceeds **5%**, an asynchronous **FFmpeg** transcoding pipeline initiates to downscale the live file into a separate, lightweight `144p` stream format.
    *   The frontend dynamically lets users switch between default and `144p` quality streams.
*   **HTTP Range Requests Support:** Full support for standard browser range-request-seeking, enabling users to jump forward or backward smoothly.

### 💬 Social & Multilingual Engagement
*   **Real-time Comments Section:** Share opinions directly on the watch page of any indexed movie identifier.
*   **Viewing History Tracker:** Automatically logs watched movies inside the user's secure account space.
*   **Fully Translated UI:** Toggle seamlessly between English (`en`) and French (`fr`) translations instantly.

---

## 🛠️ Configuration & Environment Variables

Create a `.env` file in the root directory to populate configuration settings before building.

```env
# Database Credentials
POSTGRES_USER=postgres_user_here
POSTGRES_PASSWORD=postgres_password_here
POSTGRES_DB=postgres_db_here

DB_BACKEND_USER=movies_user
DB_BACKEND_NAME=movies_production
DB_MOVIES_BACKEND_PASSWORD=movies_password_here

# API Keys
tmdb_api_key=your_tmdb_api_key_here

# Google OAuth Configuration
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret

# GitHub OAuth Configuration
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 42 Intra Configuration
FORTYTWO_CLIENT_ID=your_fortytwo_client_id
FORTYTWO_CLIENT_SECRET=your_fortytwo_client_secret

# Google SMTP Credentials (Mailers)
GOOGLE_SMTP_USERNAME=your_gmail_address
GOOGLE_SMTP_PASSWORD=your_app_password
```

---

## 🚀 Quick Start Guide

### Prerequisites
*   [Docker](https://www.docker.com/) and [Docker Compose](https://docs.docker.com/compose/) installed on your host system.
*   SSL Certificates (`fullchain.pem` and `privkey.pem`) mapped inside the `./certs` folder to secure the NGINX HTTPS proxy server.

### Running the Project

1. **Verify directory structure & SSL certs:**
    Make sure your certificates are placed in the root folder structure:
    ```bash
    ./certs/fullchain.pem
    ./certs/privkey.pem
    ```

2. **Boot the services:**
    Run the following command to download, build, and run all services in detached mode:
    ```bash
    docker-compose up --build -d
    ```

3. **Accessing the App:**
    Open your browser and navigate to:
    `https://localhost` (Nginx automatically manages port `443` secure connection).

### Resetting/Cleaning the Stack
A utility script `reset.sh` is provided in the repository to completely clean down and reset all running docker containers, images, and mapped databases:
```bash
./reset.sh
```

---

## 📂 Codebase Directory Overview

```
├── auth/                       # Rails authentication & OAuth microservice
│   ├── app/                    # Controllers, Mailers, Models, and Views
│   ├── db/                     # DB schemas & migrations
│   └── Dockerfile              # Rails container setup
├── movies/                     # Django Torrent indexer & stream microservice
│   ├── movies/                 # Core Django setup & settings
│   ├── search/                 # TMDb index & search controllers
│   ├── stream/                 # Libtorrent downloader, FFmpeg transcoder & streaming views
│   └── Dockerfile              # Django container setup
├── frontend/                   # React single-page frontend application
│   ├── my-react-app/           # React Router implementation
│   │   ├── app/                # Styles, components, languages & route pages
│   │   └── package.json        # Frontend NPM configurations
│   └── Dockerfile              # Frontend container setup
├── certs/                      # Mapped folder for SSL fullchain & private key
├── nginx.conf                  # Nginx HTTP/HTTPS redirection and microservice routing
├── docker-compose.yaml         # Full orchestration file for all components
├── init.sql                    # Initial database and user permissions script
└── reset.sh                    # Complete project reset script
```

---

## 🛡️ License
This project is engineered as an educational cinematic streaming prototype. All rights reserved.
