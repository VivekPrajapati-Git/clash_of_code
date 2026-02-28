# 🏥 Hospital Infection Risk & Management System

> **An AI-powered, real-time hospital management platform designed to track patient flow, manage equipment, and proactively predict infection outbreaks using Graph Neural Networks.**

![Dashboard Preview](frontend/public/window.svg) <!-- You can replace this with an actual screenshot later -->

---

## 🌟 Inspiration
In high-stress hospital environments, tracking the spread of infections and managing medical equipment is a logistical nightmare. This project bridges the gap between traditional hospital management systems and cutting-edge artificial intelligence to create a safer environment for patients and staff alike. 

## 🚀 Key Features

* **🛡️ AI Infection Risk Engine**: Utilizes PyTorch Geometric (`RiskGAT`) to analyze the Neo4j hospital interaction graph. It predicts patient infection risks and traces contamination vectors back to specific rooms or equipment.
* **📊 Smart Report Ranking**: A dedicated FastAPI microservice that automatically analyzes clinical reports and assigns a priority score (High/Medium/Low), ensuring critical patients are attended to first.
* **🗺️ Real-Time Graph Visualization**: Deep Neo4j integration visually maps exactly who interacted with whom, and what equipment they touched, rendered beautifully on the frontend using Force-Directed Graphs.
* **🛏️ Comprehensive Resource Tracking**: Total visibility over hospital locations (Wards, ICUs) and equipment statuses (Clean, In Use, Contaminated).
* **📈 Interactive Analytics Dashboard**: A sleek Next.js dashboard featuring live charts, recent interactions, and critical statistics using Recharts and Shadcn UI.

---

## 💻 Tech Stack

Our platform is engineered using a robust, highly scalable microservices architecture:

### Frontend
- **Framework**: Next.js 15 (App Router) & React 19
- **Styling**: Tailwind CSS & Shadcn UI
- **Data Visualization**: Recharts, React-force-graph (D3)
- **Forms & Validation**: React Hook Form with Zod

### Backend (Node.js API)
- **Framework**: Express.js
- **Primary Database**: MySQL (Structured patient, staff, location, and equipment data)
- **Document Store**: MongoDB/Mongoose (Unstructured clinical reports)
- **Graph Database**: Neo4j (Mapping complex hospital interactions and contamination graphs)
- **Authentication**: JWT (JSON Web Tokens)

### AI Microservices (Python)
- **Infection Risk Engine**: FastAPI, PyTorch, PyTorch Geometric
- **Report Ranking Engine**: FastAPI

---

## 🏗️ Architecture Flow

1. **Patient Interactions**: Every time a patient is admitted, transferred, or uses equipment, an event is logged in MySQL and replicated as an edge in the **Neo4j Graph Database**.
2. **AI Analysis**: The Node.js backend pings the **Infection Risk Engine**, which fetches the latest Neo4j subgraph and runs it through the `RiskGAT` model to flag potentially contaminated equipment and at-risk patients dynamically.
3. **Clinical Reports**: Lab reports are submitted to the Node backend, saved in **MongoDB**, and passed instantly to the **Report Ranking Engine** to calculate triage priority before hitting the doctor's dashboard.

---

## ⚙️ Local Setup & Installation

### Requirements
- Node.js (v18+)
- Python (3.11+)
- MySQL Server
- MongoDB Server
- Neo4j Desktop or AuraDB

### 1. Backend Setup
```bash
cd backend
npm install
# Create a .env file with your DB credentials (MySQL, MongoDB, Neo4j, JWT_SECRET)
npm run dev
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run dev
```

### 3. AI Engines Setup
You need to run both Python microservices in separate terminal windows on different ports.
```bash
# Terminal 3: Risk Engine (Runs on port 8000)
cd risk-engine
pip install -r requirements.txt # Ensure torch and torch-geometric are installed
uvicorn app:app --port 8000 --reload

# Terminal 4: Report Ranking Engine (Runs on port 8001)
cd report-ranking
pip install -r requirements.txt
uvicorn app:app --port 8001 --reload
```

---

## 🤝 Contributing
Feel free to fork the repository, open issues, and submit pull requests. For major changes, please open an issue first to discuss what you would like to change.

## 🏆 Hackathon Details
Built with ❤️ during the **Clash of Code** Hackathon.