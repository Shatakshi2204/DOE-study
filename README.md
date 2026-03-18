DOE Study — PCB Soldering Process Optimization
Apple PQE Internship Portfolio | 2³ Full Factorial Design of Experiments
🔗 Live Demo: doe-study.vercel.app

<img width="1914" height="859" alt="image" src="https://github.com/user-attachments/assets/5bdba74f-36e8-44ea-8a61-9fdbdcb32987" />

<img width="1894" height="869" alt="image" src="https://github.com/user-attachments/assets/63fcea9f-7a7a-4e9d-9e62-7f55a58df4eb" />

<img width="1898" height="837" alt="image" src="https://github.com/user-attachments/assets/972bb2f9-49be-4e34-b511-bb47a6f49323" />

Overview
A full-stack web application demonstrating a 2³ Full Factorial Design of Experiments applied to PCB micro-soldering process optimization — directly aligned with Apple's process qualification engineering (PQE) workflows for micro-joining and advanced packaging validation.
Three process factors were systematically tested across 8 experimental runs to identify their individual and combined influence on solder joint pull strength. Results include a Cost of Quality financial analysis projecting $498,000 in annual savings from process optimization.

Key Results
FindingValueDominant FactorTemperature (+16 MPa effect)Key InteractionTemp × Time — must be controlled simultaneouslyOptimal Settings260°C · 1.5 MPa · 7sPredicted Strength64.5 MPa (spec >50 MPa ✅)Defect Reduction4.2% → 0.8% (81% improvement)Annual CoQ Savings~$498,000

Features

Interactive Design Matrix — all 8 runs with color-coded factor levels and strength values
Main Effects Chart — visualizes slope of each factor's influence
Pareto of Effects — ranks all main effects and interactions by magnitude
Optimal Configuration — recommended settings with validation plan
Live Predictor — adjust sliders to predict joint strength in real time
Cost of Quality Dashboard — baseline vs. optimized process financial comparison


Stack
LayerTechnologyHostingFrontendReact + Recharts + ViteVercelBackendFastAPI + NumPyRenderAnalysisPython (physics-informed model)—NotebookJupyterLocal

Local Development
bash# Backend
cd backend
pip install fastapi uvicorn numpy
python -m uvicorn main:app --reload
# → http://localhost:8000

# Frontend
cd frontend
npm install
npm run dev
# → http://localhost:5173

API Endpoints
MethodEndpointDescriptionGET/doeFull 2³ DOE analysisPOST/predictPredict strength for any settingsPOST/coqCost of Quality with custom parameters

Validation Plan (Production Context)

30-sample confirmation lot → Cpk ≥ 1.67
SEM cross-section → IMC thickness 1–4 µm (per IPC standard)
X-ray inspection → void% < 5% per IPC-7095
Update control plan with tightened temperature tolerance (±2°C)


Project Context
Built as Project 2 of a 3-project Apple PQE internship portfolio, demonstrating:

Statistical process thinking (DOE methodology)
Engineering analysis (main effects, interactions, process optimization)
Business impact quantification (Cost of Quality framework)
Full-stack deployment (React + FastAPI + Vercel + Render)


Shatakshi Guha · BTech CSE Final Year · VIT Bhopal
