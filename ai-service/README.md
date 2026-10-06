# LumiChain AI Service

AI layer for **LumiChain** — an AI + IoT + Blockchain smart streetlight maintenance system.

## Project Structure

```
ai-service/
├── data/               # Raw and processed datasets
├── models/             # Saved trained model files
├── notebooks/          # Jupyter notebooks for EDA and experimentation
├── preprocessing/      # Data preprocessing scripts and utilities
├── training/           # Model training scripts
├── prediction/         # Inference and prediction scripts
├── api/                # FastAPI application (future)
├── tests/              # Unit and integration tests
├── requirements.txt    # Python dependencies
└── README.md
```

## Tech Stack

| Component       | Library / Framework              |
|-----------------|----------------------------------|
| Language        | Python 3.11+                     |
| Data Processing | Pandas, NumPy                    |
| ML              | Scikit-learn, Joblib             |
| Visualization   | Matplotlib, Seaborn              |
| API             | FastAPI, Uvicorn, Pydantic       |

## Setup

### 1. Create and activate virtual environment

```bash
# Create
python -m venv venv

# Activate (Windows)
venv\Scripts\activate
```

### 2. Install dependencies

```bash
pip install -r requirements.txt
```

### 3. Verify installation

```bash
python -c "import pandas, numpy, sklearn, matplotlib, seaborn, joblib, fastapi, uvicorn, pydantic; print('All dependencies OK')"
```
