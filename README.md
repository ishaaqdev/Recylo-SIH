<div align="center">
  <img src="docs/images/logo.png" alt="Recylo Logo" width="500" />
</div>

<br/>

<div align="center">
  <img src="docs/images/gov_india.png" alt="Gov of India" height="80" style="margin: 0 20px;" />
  <img src="docs/images/IP_rights.png" alt="IP India Logo" height="80" style="margin: 0 20px; background:white; padding:6px; border-radius:8px" />
  <img src="docs/images/SIH logo.png" alt="SIH Logo" height="80" style="margin: 0 20px;" />
  <img src="docs/images/BGSCET logo.png" alt="BGSCET Logo" height="80" style="margin: 0 20px;" />
  <img src="docs/images/GIET_logo.png" alt="GIET Logo" height="80" style="margin: 0 20px;" />
</div>
<br/>

<div align="center">
  <img src="https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" />
  <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" />
  <img src="https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white" />
  <img src="https://img.shields.io/badge/Supabase-181818?style=for-the-badge&logo=supabase&logoColor=3ECF8E" />
  <img src="https://img.shields.io/badge/Framer_Motion-0055FF?style=for-the-badge&logo=framer&logoColor=white" />
  <br/>
  <img src="https://img.shields.io/badge/TensorFlow-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/TF_Lite-FF6F00?style=for-the-badge&logo=tensorflow&logoColor=white" />
  <img src="https://img.shields.io/badge/Python-3776AB?style=for-the-badge&logo=python&logoColor=white" />
  <img src="https://img.shields.io/badge/ONNX-005CED?style=for-the-badge&logo=onnx&logoColor=white" />
  <img src="https://img.shields.io/badge/OpenCV-5C3EE8?style=for-the-badge&logo=opencv&logoColor=white" />
  <img src="https://img.shields.io/badge/Raspberry_Pi_5-C51A4A?style=for-the-badge&logo=raspberry-pi&logoColor=white" />
</div>

<br/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

 
**Live Technical Preview:** [See Live Demo and site](https://ishaaqdev.github.io/Recylo-SIH/)

---

## The Story: Our 120-Hour Hackathon Journey

This project was developed during the **Smart India Hackathon (SIH)**, from **Dec 9, 2025 to Dec 12, 2025**. For 120 grueling hours, our team worked tirelessly in a rigorous 5-day hardware and software hackathon at our nodal centre: **GIET Gunupur, Odisha**. 

We didn't just build a device; we built an entire ecosystem to tackle India's waste management crisis from the ground up. To make our AI incredibly robust and context-aware, **we collected real-world data directly from the venue**. This meant scanning and analyzing India-specific brands, wrappers, and products, ensuring our model was tuned to the exact waste it would encounter in real-life Indian environments.

**Design Registration & Patent Info:**
- **Design Application No.:** 482604-001 (Filed on 4th December 2025)
- **Title:** Waste segregation device
- **Class:** 15, Sub-class: 99
- **Applicant:** BGS College of Engineering and Technology (BGSCET)

---

## Problem Statement

- **Problem Statement ID:** 25046
- **Problem Statement Title:** Smart Waste Segregation and Recycling System
- **Description:** Design an IoT-enabled waste segregation system using sensors and machine learning to automatically classify household waste (organic, recyclable, hazardous) at the source. The system should integrate with municipal waste management for efficient collection and recycling.
- **Expected Outcome:** A prototype device with 90% accuracy in waste classification, coupled with a mobile app for households to monitor waste disposal and earn incentives for recycling.
- **Technical Feasibility:** Uses affordable sensors (e.g., cameras, weight sensors) and ML models (e.g., convolutional neural networks) for waste identification, deployable in urban and semi-urban areas.
- **Organization:** Government of Odisha
- **Department:** Electronics & IT Department
- **Category:** Hardware
- **Theme:** Clean & Green Technology

---

## Project Structure

```text
recylo/
├── ai/                     # AI Inference Logic & ONNX Models
├── app/                    # Unified React Application (Citizen/Driver/Admin)
├── hardware/               # Raspberry Pi 5 / GPIO & Servo Control Logic
├── docs/                   # Project Documentation & Static Assets
│   ├── index.html          # Technical Showcase Website
│   ├── Certificates/       # Patent & Registration Certificates (PDF)
│   ├── Demo_Video.mp4      # Project Demonstration Video
│   └── images/             # UI Mockups & Hardware Imagery
└── README.md               # Main Repository Documentation
```

## System Architecture & Workflow

For detailed hardware pin mappings, see [Hardware Connections](docs/hardware_connections.md).
```mermaid
graph TD
    A[Waste Dropped] -->|Camera| B(Image Preprocessing 224x224 RGB)
    B --> C{CNN Inference}
    C -->|Classifies| D(Pan-Tilt Servo Routing)
    D --> E[Waste Dropped into Target Bin]
    
    E --> F((Load Cells & Ultrasonic Sensors))
    F -->|Weight & Fill Data| G[(Cloud Database / Supabase)]
    C -->|Classification Logs| G
    
    G --> H[Household App]
    G --> I[Driver App]
    G --> J[Municipal Dashboard]
```

### 1. The Machine Learning Model (AI)
The core of our segregation system relies on a Convolutional Neural Network (CNN). We utilized a MobileNet V2 / ResNet-based architecture optimized for edge devices.
- **Preprocessing:** The Raspberry Pi Camera captures a high-resolution RGB image. We preprocess this by resizing the frame to 224x224 and normalizing the pixel values.
- **Inference:** We export our trained model to an `.onnx` format (`waste_classifier.onnx`). Using `onnxruntime`, the Raspberry Pi performs local inference in milliseconds without needing an internet connection.
- **Classification:** The model classifies the waste into one of 10 highly specific sub-classes (e.g., cardboard, biomedical, e-waste) which are then logically mapped to the 4 main physical bins (Recyclable, Non-Recyclable, Organic, Hazardous).

### 2. The Hardware (Physical Device)
The Raspberry Pi 5 orchestrates the entire physical sorting mechanism. For a detailed list of GPIO pin mappings and connections, please see the [Hardware Connections Document](docs/hardware_connections.md).
- **Raspberry Pi 5:** Edge-computing unit.
- **Pi Camera Module (1080p):** Captures waste images.
- **Pan-Tilt Servo Motors:** Routes the waste.
- **Load Cells + HX711 ADC:** Gamifies the experience by tracking exact waste weight.
- **Ultrasonic Sensors (HC-SR04):** Measures compartment fill levels.
- **3.5-inch Touch LCD:** User interaction at the bin.

### 3. The Software (Web App)
Built on React and Vite, the software ecosystem is hosted in a single frontend repository but acts as three distinct portals via routing:
- **Citizen / User App** (`/`) - Gamified interface for users to track points and claim rewards.
- **Truck Driver App** (`/driver`) - Optimized routes and pickup logs for municipal drivers.
- **Municipal Dashboard** (`/municipal`) - Analytics and bird's-eye view of ward-level waste generation for city planners.

---

## How to Clone, Run, and Use

### Prerequisites
- Node.js (v18+)
- Python 3.9+

### Step 1: Clone the Repo
```bash
git clone https://github.com/ishaaqdev/Recylo-SIH.git
cd Recylo-SIH
```

### Step 2: Run the Web Apps (Localhost)
Navigate to the `app` directory to launch the web portals:
```bash
cd app
npm install
npm run dev
```
Access all three applications simultaneously on `http://localhost:5173`:
- **User App:** `http://localhost:5173/`
- **Driver App:** `http://localhost:5173/driver`
- **Municipal Dashboard:** `http://localhost:5173/municipal`

### Step 3: Run the Hardware / AI (Raspberry Pi)
```bash
cd hardware
pip install -r ../requirements.txt
python pipeline_runner.py
```

---

## Gallery
We have attached our design patent certificates and physical hardware build images (including our time at the venue) in the `/docs/images/` directory. Feel free to explore them!

---

## The Team

A massive shoutout to the incredible minds that made this possible in 120 hours:

- **Mohammed Ishaaq** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](https://github.com/ishaaqdev) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/ishaaq42/)
- **D Karthik Raj** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](https://github.com/dkarthikraj) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/d-karthik-raj-70b285326/)
- **Ullas M** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](https://github.com/ullasroxx) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/ullas-m-naik/)
- **Hema B** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](https://github.com/hema004-pjt) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/hema-b-2581b6301/)
- **Namratha N** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](#) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/namratha-n-835937396/)
- **Nikhitha N** <br> <img src="https://cdn-icons-png.flaticon.com/512/25/25231.png" width="12"/> [GitHub](https://github.com/Nikhitha-38) &nbsp;|&nbsp; <img src="https://cdn-icons-png.flaticon.com/512/174/174857.png" width="12"/> [LinkedIn](https://www.linkedin.com/in/nikhitha-nagaraj-21b075373/)

---

**License:** This project is licensed under the [MIT License](LICENSE).
