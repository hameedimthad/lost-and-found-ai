# Lost & Found AI Server Deployment Guide

Because the app now has unified serving (FastAPI serves both the API and the React SPA on port 8000), deployment is simple.

> [!IMPORTANT]
> **HTTPS is Required for Live Camera**:
> Modern mobile and desktop browsers only allow camera access (`navigator.mediaDevices.getUserMedia`) over **`localhost`** or secure **`https://`** connections. When publishing to a public server, make sure to enable HTTPS (free with Let's Encrypt / Cloudflare).

---

## 🚀 Option 1: Docker Deployment (Recommended for any VPS)
Works on any Linux server (AWS EC2, DigitalOcean Droplet, Linode, Hetzner, Google Cloud).

### Step 1: Copy Code to Your Server
On your local machine, initialize git and push to GitHub/GitLab:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin <your-github-repo-url>
git push -u origin main
```

On your server (e.g. Ubuntu 22.04 / 24.04):
```bash
git clone <your-github-repo-url>
cd "Lost & Found"
```

### Step 2: Install Docker & Compose (if not already installed)
```bash
curl -fsSL https://get.docker.com | sh
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```
Your app will be live on `http://YOUR_SERVER_IP:8000`.

---

## ☁️ Option 2: Render.com / Railway (Zero Server Setup)
If you don't want to manage a Linux server or SSL certificates:

### Deploy on Render:
1. Push your code to GitHub.
2. Go to [render.com](https://render.com) and log in.
3. Click **New +** -> **Web Service**.
4. Connect your GitHub repository.
5. In the settings:
   - **Environment**: `Docker`
   - **Plan**: Standard or Free (Note: PyTorch runs best with at least 1GB - 2GB RAM).
6. Click **Deploy Web Service**.
7. Render automatically generates a free `https://your-app.onrender.com` domain with automatic HTTPS!

### Deploy on Railway:
1. Go to [railway.app](https://railway.app).
2. Click **New Project** -> **Deploy from GitHub repo**.
3. Select your repository. Railway detects the `Dockerfile` automatically and deploys it with free HTTPS.

---

## 🔒 Option 3: Setting Up a Custom Domain with Nginx & Free SSL (Let's Encrypt)
On an Ubuntu VPS with your custom domain (e.g., `findlost.com`):

### 1. Install Nginx & Certbot:
```bash
sudo apt update
sudo apt install -y nginx certbot python3-certbot-nginx
```

### 2. Configure Nginx:
Create `/etc/nginx/sites-available/lostfound`:
```nginx
server {
    server_name yourdomain.com www.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/lostfound /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### 3. Get Free SSL Certificate (HTTPS):
```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

Now your app is accessible at `https://yourdomain.com` with fully functional camera and AI matching!
