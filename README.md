# VoxSales AI – Autonomous AI Voice Sales Bot for SaaS

> **Autonomous SaaS AI Voice Sales Platform**  
> **Objective:** Build a working AI voice bot that can sell any SaaS product through an interactive voice conversation.

---

## 🌟 Executive Summary

**VoxSales AI** is an enterprise-grade autonomous AI Voice Sales Platform engineered to sell any SaaS product. It conducts real-time two-way voice conversations with customers, handles sales discovery, answers pricing and technical questions, resolves objections, and drives conversions. 

### 🏆 Assignment Requirements Compliance Matrix

| # | Requirement | Implementation in VoxSales AI | Status |
|---|---|---|---|
| **1** | **Voice Conversation** | Two-way voice dialogue using Web Speech API (SpeechRecognition + SpeechSynthesis) with natural cadence and interruption handling. | ✅ Fully Operational |
| **2** | **Language Support** | Full native support for **English**, **Hindi (हिन्दी)**, and **Telugu (తెలుగు)** with language-tailored sales scripts and accent recognition. | ✅ Fully Operational |
| **3** | **Live Chat Screen** | Real-time chat feed with bot/customer avatars, timestamps, and live animated audio frequency waveform visualizer. | ✅ Fully Operational |
| **4** | **Call Controls** | Start Call, End Call, Mute Microphone, Mute Speaker, live timer (`00:00`), and real-time status transitions (`Ready`, `Speaking`, `Listening`, `Analyzing`, `Ended`). | ✅ Fully Operational |
| **5** | **Call Recording & Playback** | Pre-call mandatory consent agreement. Captures audio via `MediaRecorder`, saves audio to server (`/recordings/`), and provides built-in waveform audio playback with download option. | ✅ Fully Operational |
| **6** | **AI Post-Call Summary** | Automatically extracts Executive Summary, Customer Requirements, Objections Handled, and Recommended Next Steps immediately when call concludes. | ✅ Fully Operational |
| **7** | **Sales Status Assignment** | Automated classification into all 6 mandatory statuses: `Converted`, `Interested`, `Follow-up Required`, `Not Interested`, `Demo Requested`, and `No Response`. | ✅ Fully Operational |
| **8** | **Call History & CRM** | Interactive CRM dashboard with KPI metrics (Conversion rate, Demo rate), status filter pills, search bar, language filter, JSON export, and full conversation inspect modal with PDF report export. | ✅ Fully Operational |
| **+** | **Sell ANY SaaS Product** | SaaS Product Studio pre-configured with 3 enterprise SaaS products (*NexusFlow AI*, *CloudGuard Pro*, *ScalePulse CRM*) plus a **Custom SaaS Builder** to train the bot on any product in 30 seconds. | ✅ Fully Operational |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended, tested on Node v24)
- **Modern Web Browser** (Google Chrome, Microsoft Edge, Brave, or Safari with microphone permissions enabled)

### Installation & Launch

1. Open your terminal in the project directory:
   ```bash
   cd c:\Sankar
   ```

2. Dependencies are already installed (`express`, `cors`, `multer`). If running on a new machine:
   ```bash
   npm install
   ```

3. Start the application:
   ```bash
   npm start
   ```

4. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

---

## 🎯 Architecture & Module Breakdown

```
c:\Sankar\
├── server.js               # Express REST API (Products, Calls, Audio Uploads, AI Analyzer)
├── package.json            # Project dependencies and startup scripts
├── data/
│   ├── calls.json          # Persistent Call History & CRM database
│   ├── products.json       # Configured SaaS catalog & custom products
│   └── recordings/         # Stored WebM/WAV call audio recordings
├── public/
│   ├── index.html          # Semantic HTML5 Application Interface
│   ├── css/
│   │   └── styles.css      # Ultra-premium Dark Glassmorphism Design System
│   └── js/
│       ├── app.js          # UI Controller, timers, canvas visualizer & event bindings
│       ├── voiceEngine.js  # SpeechRecognition, SpeechSynthesis & MediaRecorder engine
│       ├── salesBot.js     # Sales state machine (Greeting -> Discovery -> Objection -> Closing)
│       ├── aiAnalytics.js  # Post-call NLP intelligence & 6-stage sales status classifier
│       ├── products.js     # SaaS catalog manager & custom product builder
│       └── crmStorage.js   # CRM storage, status filtering, search & report exporter
└── README.md               # Documentation & Evaluation Guide
```

---

## 🎙️ Step-by-Step Feature Walkthrough

### 1. Interactive Voice Call Studio
- Select a SaaS product to sell (e.g., **NexusFlow AI**, **CloudGuard Pro**, or **ScalePulse CRM**).
- Select your preferred language: **English**, **Hindi (हिन्दी)**, or **Telugu (తెలుగు)**.
- Confirm the mandatory **Call Recording Consent** checkbox.
- Click **"Start Call"**:
  - The AI sales bot greets you with voice audio and a chat message.
  - The real-time audio visualizer animates dynamically.
  - The call duration timer begins counting up (`00:00`).
- Speak via your microphone, or use the **Quick-Speak Customer Prompts** (e.g., *"What is the pricing?"*, *"Can you give a demo?"*, *"Ready to Buy"*).
- The bot handles objections and guides the conversation toward a conversion or demo booking.
- Click **"End Call"**: The audio recording is finalized, AI analysis runs automatically, and the post-call report is presented.

### 2. Post-Call Sales Intelligence Report
Immediately upon ending a call, a comprehensive modal pops up displaying:
- **Assigned Sales Status Badge**: Highlighted in distinct luminous colors (`Converted`, `Demo Requested`, `Interested`, `Follow-up Required`, `Not Interested`, `No Response`).
- **Interactive Audio Player**: Listen to the recorded call audio with play/pause, seek bar, and a direct download button.
- **Executive Conversation Summary**: 3–4 sentence high-level overview.
- **Customer Requirements Identified**: Specific customer pain points, team sizes, or technical needs.
- **Objections Raised & Handled**: Budget, competition, or security concerns addressed during the call.
- **Recommended Next Steps**: Tailored action items based on the final sales status.

### 3. CRM Dashboard & Call History
- Switch to the **"Call History & CRM"** tab.
- View top-level sales metrics: Total Calls, Win/Demo Conversion Rate, and counts for each status.
- Filter conversations by status pills (`All`, `Converted`, `Demo Requested`, `Interested`, etc.).
- Search across customer names, companies, products, or summaries.
- Filter by language (**English**, **Hindi**, **Telugu**).
- Click **"View"** on any record to open the complete dialogue transcript, listen to the audio recording, and click **"Export PDF / Print"** for an executive sales call report.

### 4. Custom SaaS Product Builder
- Click the **"SaaS Products"** tab.
- Enter any custom SaaS product name, pricing, tagline, value pitch, and key features.
- Click **"Save & Set as Active Sales Product"**.
- Return to the Call Studio: the AI sales bot is immediately re-trained to sell your custom product!

---

## 🌐 Multi-Language Capabilities

The bot natively handles three key languages:
1. **English**: Global & Indian business accents, enterprise SaaS terminology.
2. **Hindi (हिन्दी)**: Native Hindi voice prompts and recognition (e.g., *"नमस्ते! NexusFlow AI में आपका स्वागत है"*).
3. **Telugu (తెలుగు)**: Native Telugu voice prompts and recognition (e.g., *"నమస్కారం! మీ వ్యాపార అమ్మకాలను వేగవంతం చేయడంలో నేను ఎలా సహాయపడగలను?"*).

---

## 📹 Video Demonstration & Walkthrough Recording

A browser demonstration recording has been generated and saved:
- Recording Name: `voxsales_demo_walkthrough`
- Recording Path: `C:\Users\chand\.gemini\antigravity-ide\brain\120cbbaa-b2eb-4e49-94ab-2eb8748a59f4\voxsales_demo_walkthrough_1792480783568.webp`

### Video Script Outline for Walkthrough:
1. **Introduction (0:00 - 0:30)**: Overview of VoxSales AI and demonstration of core AI voice sales capabilities.
2. **Configuration & Consent (0:30 - 0:50)**: Selecting SaaS product (*NexusFlow AI*), language (*English/Hindi/Telugu*), and verifying recording consent.
3. **Live Voice Call (0:50 - 2:00)**: Placing call, demonstrating two-way voice dialogue, audio visualizer, real-time live chat stream, and objection handling.
4. **Call Termination & AI Report (2:00 - 2:40)**: Ending call, reviewing automated sales status classification (*Converted*), audio playback, and extracted requirements/objections.
5. **CRM Dashboard (2:40 - 3:20)**: Navigating Call History, filtering by status, searching records, and inspecting full transcripts.
6. **Custom SaaS Builder (3:20 - 3:50)**: Creating a new SaaS product on the fly and demonstrating bot adaptability.
7. **Conclusion (3:50 - 4:00)**: Summary of tech stack and design decisions.

---

## 🛠️ Technology Stack & Design Decisions

- **Backend**: Node.js & Express.js REST API
- **Audio Capture & Storage**: HTML5 `MediaRecorder` API + `Multer` multipart storage
- **Voice Intelligence**: Web Speech API (`SpeechRecognition` & `SpeechSynthesis`) with dynamic voice matching and interruption handling
- **Frontend**: Semantic HTML5, Vanilla JavaScript (ES6+ modular architecture)
- **Styling**: Vanilla CSS3 custom design system (Dark obsidian theme, glassmorphism, glowing status badges, responsive grid layout)
- **Persistence**: Server-side JSON store (`data/calls.json`) with client-side `localStorage` sync for 100% offline reliability.
