# TelemetryIQ Dashboard 📈

**TelemetryIQ** is a full-stack, real-time observability dashboard that simulates live infrastructure monitoring. Built with a 3-tier architecture, it ingests live telemetry data from a background agent, processes it server-side, and streams real-time metrics, system health, and custom alerts to the UI via WebSockets.

The project demonstrates a seamless integration between a simulated physics-based data generator, an intelligent Express/Node.js backend alert engine (using an in-memory ring buffer), and a responsive React frontend dashboard.

---

## ⚡ Key Features

*   **Real-Time Data Streaming:** Instantly displays CPU, Memory, Uptime, and Error metrics via Socket.io.
*   **Intelligent Backend Engine:** Automatically detects system anomalies (threshold breaches) and computes a live penalty-based health score.
*   **Standalone Telemetry Agent:** A background Node.js service that simulates server physics to generate realistic, correlated traffic spikes and metrics.
*   **Modern Frontend:** A beautiful, responsive dashboard built with React, Vite, and TypeScript.

## 🛠️ Tech Stack

*   **Frontend:** React 18, Vite, TypeScript, Tailwind CSS, Radix UI, Recharts
*   **Backend:** Node.js, Express.js
*   **Real-Time Communication:** Socket.io
*   **Data Storage:** In-Memory Ring Buffer

---

## 🚀 Running the Project

### One-Click Start (Recommended for Reviewers/Recruiters)

For an effortless setup, use the provided batch script. It automatically installs all dependencies across the frontend, backend, and agent, and launches them in separate terminal windows.

1. Clone the repository.
2. Double-click the **`run.bat`** file in the root directory.
3. Wait a few seconds for all 3 terminals to pop up and for the servers to initialize.
4. The frontend dashboard will be running at `http://localhost:5173`.

### Manual Start

If you prefer to start each service manually in separate terminals:

1. **Frontend (Dashboard):**
    ```bash
    npm i
    npm run dev
    ```
    *Runs on `http://localhost:5173`*

2. **Backend (API & WebSockets):**
    ```bash
    cd server
    npm i
    npm start
    ```
    *Runs on `http://localhost:4000`*

3. **Telemetry Agent (Data Simulator):**
    ```bash
    cd agent
    npm i
    npm start
    ```
    *Constantly posts data to the backend every 5 seconds.*