# Project 2: DOE Study — PCB Soldering Process
**Apple PQE Internship Portfolio**

Live demo: `https://your-app.vercel.app` ← paste your Vercel URL here

---

## What This Is
A full-stack web application demonstrating a **2³ Full Factorial Design of Experiments** applied to PCB soldering process optimization. Built as part of an Apple PQE internship portfolio.

- **Factors:** Soldering Temperature, Pressure, Time
- **Response:** Joint Pull Strength (MPa)
- **Design:** 2³ Full Factorial (8 runs, no confounding)
- **Bonus:** Cost of Quality analysis layer

---

## Stack
| Layer | Tech | Host |
|-------|------|------|
| Frontend | React + Recharts + Vite | Vercel (free) |
| Backend | FastAPI + NumPy | Render (free) |
| Notebook | Jupyter | Local / Colab |

---

## Local Development

### 1. Backend (FastAPI)
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
# API docs: http://localhost:8000/docs
```

### 2. Frontend (React)
```bash
cd frontend
npm install
npm run dev
# App: http://localhost:5173
```

### 3. Notebook
```bash
cd notebook
jupyter notebook DOE_Analysis.ipynb
```

---

## Deployment (Step by Step)

### Step 1: Push to GitHub
```bash
git init
git add .
git commit -m "feat: DOE study - PCB soldering process optimization"
git remote add origin https://github.com/YOUR_USERNAME/project2-doe.git
git push -u origin main
```

### Step 2: Deploy Backend → Render (free)
1. Go to **render.com** → New → Web Service
2. Connect your GitHub repo
3. Set **Root Directory** to `backend`
4. Build command: `pip install -r requirements.txt`
5. Start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Click **Deploy**
7. Copy your Render URL: `https://doe-api-xxxx.onrender.com`

### Step 3: Deploy Frontend → Vercel
1. Go to **vercel.com** → New Project
2. Connect your GitHub repo
3. Set **Root Directory** to `frontend`
4. Add environment variable:
   - Key: `VITE_API_URL`
   - Value: `https://doe-api-xxxx.onrender.com` (your Render URL)
5. Click **Deploy**
6. Your app is live at `https://your-app.vercel.app` 🎉

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/doe` | Full 2³ DOE analysis |
| POST | `/predict` | Predict strength for any settings |
| POST | `/coq` | Cost of Quality with custom params |
| GET | `/health` | Health check |

**Example predict call:**
```bash
curl -X POST https://your-api.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"temperature": 250, "pressure": 1.2, "time": 6}'
```

---

## Key Findings
- **Dominant Factor:** Temperature (+16 MPa effect)
- **Key Interaction:** Temp × Time — must be controlled simultaneously
- **Optimal Settings:** 260°C · 1.5 MPa · 7s → 64.5 MPa predicted
- **CoQ Impact:** 81% defect reduction → $570K annual savings

---

## Validation Plan (Interview Ready)
1. 30-sample confirmation lot at optimal settings → Cpk ≥ 1.67
2. SEM cross-section → verify IMC thickness 1–4 µm
3. X-ray per IPC-7095 → void% < 5%
4. Update control plan with tightened temperature tolerance

---

*Part of a 3-project Apple PQE portfolio: Quality Monitoring · DOE Study · [Project 1]*
