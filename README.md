# ReuniteAI — Lost & Found AI Visual Matching Portal

A modern, mobile-friendly web application with deep visual AI matching designed to rapidly reunite lost persons and animals with their families and guardians.

---

## 🌟 Key Features

### 1. "I Lost Someone / Pet" Button
- **Person or Animal Category Toggle**
- **Multi-Photo Upload**: Select clear images or snap photos directly from camera.
- **Dedicated Information Columns for Person**:
  - Full Name
  - Age
  - Last Seen Dress / Clothing details (crucial for visual matching)
  - Distinguishing Marks (birthmarks, scars, tattoos, eyeglasses)
  - Contact Phone Number (to call in case found)
  - Last Seen Location & Date/Time
- **Dedicated Information Columns for Animal / Pet**:
  - Pet Name / Title
  - Breed & Species
  - Collar / Harness details
  - Fur markings & distinguishing physical features
  - Contact Phone Number
  - Last Seen Location

### 2. "I Found Someone / Pet" Button
- **Upload Pics from Phone**:
  - Instant mobile camera capture (`capture="environment"`)
  - Gallery / file photo upload
- **Finder's Phone Number**
- **Location**:
  - Manual text address
  - **Auto-Detect GPS**: One-click live GPS coordinate detection
- **Sighting Notes / Condition description**

### 3. Deep AI Visual Comparison Engine
- **Local Neural Embeddings**: Runs **PyTorch MobileNetV3** + **Color Distribution Histograms** locally and instantly (offline-ready, zero API cost).
- **Automatic Match Trigger**: When someone files a "Found" report (or uploads an image in the AI scanner), the system automatically computes 640-dimensional visual feature vectors and performs cosine similarity comparison against all active "Lost" records in the database.
- **Contact Number Revelation**:
  - When a match is detected (e.g. 90%+ similarity), the application presents a side-by-side photo comparison and immediately highlights the **Contact Number of the person who reported it lost**.
  - Direct **Call Now** and **WhatsApp** buttons enable instant connection between finder and guardian.

### 4. Interactive AI Photo Scanner & Feed
- **Live Scanner**: Drag & drop or take a photo of any sighted person or pet to run an instant biometric scan across the entire database with a sensitivity slider.
- **Public Feed**: Filter by Lost, Found, Person, Animal, or Reunited status.

---

## 🚀 Quick Start Guide

### Launch both servers with one command:
```bash
./start.sh
```
This automatically starts:
- **FastAPI Backend Server**: `http://127.0.0.1:8000`
- **React Frontend**: `http://localhost:5173`

Or start them manually in two terminals:

**Terminal 1 (Backend):**
```bash
source .venv/bin/activate
uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 📁 Project Structure

```
Lost & Found/
├── backend/
│   ├── main.py              # FastAPI endpoints, uploads static serving & routes
│   ├── ai_engine.py         # PyTorch MobileNetV3 + Color Histogram matching engine
│   ├── database.py          # SQLite database schema and query helpers
│   ├── requirements.txt     # Python dependencies
│   └── uploads/             # Stored photo uploads
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx           # Top header & quick actions
│   │   │   ├── Hero.jsx             # Hero section with large Lost & Found buttons
│   │   │   ├── LostModal.jsx        # Lost report modal with Person/Animal columns
│   │   │   ├── FoundModal.jsx       # Found report modal with camera upload & auto-match
│   │   │   ├── MatchResultModal.jsx # Side-by-side comparison & Contact number reveal
│   │   │   ├── ReportsFeed.jsx      # Feed of missing and found cases with search
│   │   │   └── AiQuickScanner.jsx   # Interactive AI photo scanner
│   │   ├── App.jsx                  # Root React application
│   │   └── index.css                # Tailwind CSS v4 styling & animations
│   ├── package.json
│   └── vite.config.js
├── seed_demo_data.py        # Seeds initial realistic demo cases
├── test_backend.py          # Unit tests for embedding extraction & similarity
├── test_api_integration.py  # End-to-end API test for match & contact reveal
├── start.sh                 # One-click startup script
└── README.md
```
