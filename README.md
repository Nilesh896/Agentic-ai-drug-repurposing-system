# Agentic AI Research Assistant for Drug Repurposing

An advanced, AI-driven pharmaceutical intelligence system designed to accelerate drug repurposing research. By utilizing a custom multi-agent orchestration architecture, it automates the analysis of medical literature, clinical trial data, and pharmacological databases to identify novel therapeutic applications for existing drugs.

## 🚀 Project Overview

The Agentic AI Research Assistant empowers biomedical researchers and pharmacologists by automating the labor-intensive process of literature review and data synthesis. It orchestrates specialized AI agents that interact with external medical databases to gather real-time data, synthesize evidence, and generate comprehensive, structured research reports. This system significantly reduces the time required to identify potential new uses for approved therapeutics.

## ✨ Features

- **Multi-Agent Orchestration:** Specialized AI agents handle distinct research tasks (e.g., literature review, clinical trial analysis, safety evaluation).
- **Comprehensive Data Integration:** Real-time data fetching from leading medical databases (PubMed, ClinicalTrials.gov, OpenFDA).
- **Automated Reporting:** Generates detailed, structured research reports with citations and evidence grading.
- **Interactive Dashboard:** Modern, responsive user interface designed for a seamless and intuitive user experience.
- **Robust Backend Architecture:** Scalable RESTful API backend ensuring efficient data management and agent coordination.

## 💻 Tech Stack

### Frontend
- **Framework:** Next.js, React
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **State Management:** Zustand

### Backend
- **Framework:** Node.js, Express.js
- **Language:** TypeScript
- **ORM:** Prisma
- **Database:** MySQL

### AI & Integrations
- **AI Model:** Google Gemini API
- **External APIs:** PubMed, ClinicalTrials.gov, OpenFDA

## 🏗️ Architecture Overview

The system follows a modern client-server architecture:
1. **Frontend Client:** A Next.js application provides an interactive UI for users to initiate research queries and view generated reports.
2. **Backend Server:** An Express.js application manages authentication, database interactions via Prisma, and acts as the orchestrator for the Multi-Agent system.
3. **Multi-Agent System:** Specialized agents process the query, interact with external APIs (PubMed, ClinicalTrials.gov) to gather raw data, and utilize the Gemini API to analyze and synthesize the findings.
4. **Data Persistence:** User data, query history, and generated reports are securely stored in a MySQL database.

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server
- Google Gemini API Key

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd agentic-ai-drug-repurposing-system
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   npm install
   # Create a .env file based on environment requirements (e.g., DATABASE_URL, GEMINI_API_KEY)
   npx prisma generate
   npx prisma db push
   npm run dev
   ```

3. **Frontend Setup:**
   ```bash
   cd ../frontend
   npm install
   # Create a .env file with NEXT_PUBLIC_API_URL and other necessary variables
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🔮 Future Improvements

- **Additional Database Integrations:** Incorporate sources like DrugBank, ChEMBL, and PubChem for broader chemical and target data.
- **Advanced Predictive Modeling:** Implement machine learning models to predict drug-target binding affinities.
- **Collaborative Workspaces:** Allow multiple researchers to collaborate on shared projects and reports.
- **Export Functionality:** Support exporting generated research reports to PDF and Word formats.

---
*Developed as a showcase of advanced AI integration and full-stack development capabilities.*