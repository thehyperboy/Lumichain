# LumiChain

LumiChain is an intelligent, decentralized streetlight monitoring and predictive maintenance platform that integrates **IoT Telemetry**, **Machine Learning (AI Layer)**, and **Distributed Verification**.

---

## Repository Architecture

```text
Lumichain/
├── ai-service/             # Python Machine Learning & FastAPI Inference Service
│   ├── api/                # FastAPI application endpoints (/health, /predict)
│   ├── data/               # Sensor datasets (raw & processed)
│   ├── models/             # Trained candidate models & tuned Decision Tree
│   ├── notebooks/          # Exploratory Data Analysis & visual outputs
│   ├── prediction/         # Prediction service & deterministic Decision Engine
│   ├── preprocessing/      # Data normalization & label encoding
│   ├── training/           # Training, tuning & validation pipelines
│   ├── tests/              # FastAPI test client suite
│   └── requirements.txt    # Python dependencies
│
└── backend/                # Node.js & Express REST Backend
    ├── src/
    │   ├── config/         # MongoDB Atlas database configuration
    │   └── server.js       # Express server initialization
    ├── .env.example        # Environment variable template
    └── package.json        # Node dependencies & npm scripts
```

---

## 1. AI Service Setup (Python 3.11+)

The AI service uses a tuned Decision Tree classifier combined with a deterministic Decision Engine to detect and categorize streetlight failures with 99.3% accuracy and sub-millisecond latency.

```bash
cd ai-service

# Create & activate virtual environment
python -m venv venv
venv\Scripts\activate   # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Run automated test suite
python tests/test_api.py

# Launch FastAPI development server
uvicorn api.main:app --reload --host 0.0.0.0 --port 8000
```
- **API Documentation**: http://localhost:8000/docs
- **Health Check**: http://localhost:8000/health

---

## 2. Backend Setup (Node.js & MongoDB)

The Node.js backend connects to MongoDB Atlas and coordinates data exchange between streetlights, the database, and the AI Layer.

```bash
cd backend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env
# Update .env with your MongoDB Atlas URI

# Start development server
npm run dev
```
- **Backend API**: http://localhost:5000/
- **Backend Health**: http://localhost:5000/health

---

## License
ISC
