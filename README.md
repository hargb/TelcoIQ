# 📡 TelcoIQ — AI-Powered Telecom Customer Churn Prediction

**Turning telecom customer data into actionable churn-risk insights using Machine Learning.**

TelcoIQ is a full-stack machine learning project designed to predict customer churn and help telecom businesses identify customers who may be at risk of leaving. It combines an ML model, REST APIs, a database-backed prediction history, and a web frontend in one application.

🔗 **GitHub Repository:** https://github.com/hargb/TelcoIQ

---

## 🎯 The Business Problem

Telecom operators serve lakhs or millions of customers. When customers discontinue their services, businesses can lose recurring revenue and may need to spend additional resources acquiring replacements.

Traditional approaches can make it difficult to identify at-risk customers early and prioritize retention efforts efficiently.

**TelcoIQ explores how machine learning can help answer one important question:**

> Which customers are more likely to churn, and how can businesses use that insight to prioritize retention efforts?

## 💡 Project Objectives

- Predict customer churn using a trained machine learning model.
- Generate churn probabilities and risk classifications.
- Serve predictions through a REST API.
- Store prediction history in PostgreSQL.
- Connect the backend with a Next.js frontend.
- Explore how predictive analytics can support telecom retention strategies.

## 🏗️ System Architecture

```mermaid
flowchart TD
    A[Customer Data] --> B[Preprocessing and Feature Engineering]
    B --> C[Trained ML Model]
    C --> D[Churn Probability]
    D --> E[Risk Classification]
    E --> F[FastAPI REST API]
    F --> G[Next.js Frontend]
    F --> H[PostgreSQL Database]
    H --> I[Prediction History]
```

The architecture separates model inference, API serving, data persistence, and the user interface to make the application easier to maintain and extend.

## ⚙️ Tech Stack

| Component | Technology |
|---|---|
| Machine Learning | Python, scikit-learn |
| Data Processing | Pandas, NumPy |
| Backend | FastAPI, Uvicorn |
| API Communication | REST APIs |
| Database | PostgreSQL |
| ORM | SQLAlchemy |
| Database Driver | Psycopg |
| Frontend | Next.js, React, TypeScript |
| Model Persistence | Joblib |
| Version Control | Git, GitHub |
| Deployment | Render backend planned; Vercel frontend planned |

## 🤖 Machine Learning Pipeline

1. **Data preparation:** Prepare customer data for model inference.
2. **Feature processing:** Transform input features into the representation expected by the trained model.
3. **Model inference:** Generate churn predictions using the saved model.
4. **Probability estimation:** Estimate the likelihood of churn.
5. **Risk classification:** Apply a configurable decision threshold to classify risk.
6. **API integration:** Make prediction functionality available through FastAPI.
7. **Prediction persistence:** Store prediction details and timestamps for historical review.

The project includes a saved model (`churn_model.joblib`) and model configuration metadata (`model_metadata.json`).

## 📊 Model Evaluation

Initial evaluation on the Telco Customer Churn dataset produced the following results at a selected decision threshold of **0.60**:

| Metric | Result |
|---|---:|
| ROC-AUC | 0.8421 |
| Precision | 57.30% |
| Recall | 70.90% |
| F1-score | 63.38% |

### What do these metrics mean?

- **ROC-AUC — 0.8421:** Measures how well the model distinguishes between churn and non-churn customers across classification thresholds.
- **Precision — 57.30%:** Of the customers classified as churn risks, approximately 57.3% were actual churn cases in this evaluation.
- **Recall — 70.90%:** The model identified approximately 70.9% of the actual churn cases.
- **F1-score — 63.38%:** Balances precision and recall.

These are dataset-based evaluation results, not production telecom performance or verified revenue improvements. The appropriate threshold depends on the cost of missed churn cases versus the cost of unnecessary retention interventions.

## 🔌 Backend API

The FastAPI backend exposes the following endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/` | Root endpoint |
| GET | `/health` | Health check |
| POST | `/predict` | Generate a churn prediction |
| GET | `/history` | Retrieve prediction history |

Interactive API documentation is available at `/docs` when the backend is running.

## 📁 Project Structure

```text
TelcoIQ/
├── main.py
├── requirements.txt
├── churn_model.joblib
├── model_metadata.json
├── .gitignore
└── frontend/
    ├── app/
    ├── package.json
    ├── package-lock.json
    └── README.md
```

*The structure above highlights the main project files; additional frontend files and configuration may be present.*

## 🚀 Getting Started

### Prerequisites

- Python 3.10 or a compatible Python version
- Node.js and npm for the frontend
- PostgreSQL
- Git

### 1. Clone the repository

```bash
git clone https://github.com/hargb/TelcoIQ.git
cd TelcoIQ
```

### 2. Set up the Python environment

**Windows:**

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

**macOS/Linux:**

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

### 3. Configure the database

Create a PostgreSQL database and configure the `DATABASE_URL` environment variable with its connection string.

Example format:

```text
postgresql+psycopg://USER:PASSWORD@HOST:PORT/DATABASE
```

Keep credentials in a local environment file or environment variables. Never commit database passwords or other secrets to GitHub.

### 4. Run the backend

Set `DATABASE_URL` in your environment, then run:

```bash
uvicorn main:app --reload
```

Open the API documentation:

```text
http://127.0.0.1:8000/docs
```

The application requires a working database connection for its database initialization and prediction-history functionality.

### 5. Run the frontend

Open a separate terminal:

```bash
cd frontend
npm install
```

Configure the frontend API URL in your local environment configuration:

```text
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000
```

Then start the development server:

```bash
npm run dev
```

Open:

```text
http://localhost:3000
```

*These instructions describe the intended local setup. Successful execution depends on the available dependencies, database configuration, and current application code.*

## 💼 Potential Business Applications

TelcoIQ demonstrates a possible approach to:

- **Customer retention:** Identify customers who may need proactive engagement.
- **Campaign prioritization:** Help retention teams focus on higher-risk customer segments.
- **Decision support:** Combine churn probabilities with business rules when allocating retention resources.
- **Analytics workflows:** Connect model outputs to application interfaces and persistent records.

The model is a decision-support prototype. Production adoption would require validation on representative telecom data, privacy controls, model monitoring, and measurement of actual business outcomes.

## 🔭 Future Improvements

- Explainable AI to identify key churn drivers.
- Customer segmentation and personalized retention recommendations.
- Model monitoring and data-drift detection.
- Model versioning and reproducible evaluation.
- Authentication and role-based access control.
- Automated testing and CI/CD.
- Production deployment, logging, and observability.
- Business dashboards for churn trends and retention campaign analysis.

## 🧠 Key Learnings

This project explores the complete path from a business problem to an application that serves machine learning predictions.

It brings together model inference, REST API development, database integration, and frontend engineering—highlighting that practical ML engineering involves more than training a model.

## 👨‍💻 Author

Built as a portfolio project inspired by telecom industry challenges and an interest in applying AI/ML to real-world business problems.

**Harsh Aggarwal**

🔗 GitHub: https://github.com/hargb/TelcoIQ

---

⭐ If you find this project interesting, consider starring the repository or sharing suggestions for improving its real-world telecom use cases.
