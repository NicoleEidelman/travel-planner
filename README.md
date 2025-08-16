# Travel Planner MVP 🗺️
A comprehensive full-stack web application for planning personalized travel routes with real-time weather integration and interactive mapping.

---

## ✨ Project Overview
**Travel Planner** lets authenticated users generate customized **hiking** and **cycling** routes based on a destination. It uses real road/trail networks, shows a compact 3-day forecast (starting **tomorrow**), and supports saving & revisiting trips. Optional AI generates short travel narratives.

---

## ✨ Core Features
- **User Authentication:** Secure registration/login (cookie-based sessions; bcrypt password hashing)
- **Intelligent Route Generation:**  
  - Hiking (single-day loop, ~**5–15 km**)  
  - Cycling (two-day point-to-point, **≤ 60 km/day**)  
  - Powered by **OpenRouteService**
- **Interactive Mapping:** Real-time route visualization with **Leaflet.js**
- **Weather Integration:** **Open-Meteo** 3-day forecast starting **tomorrow**
- **Trip Management:** Save trips and view them later (History)
- **Destination Intelligence:** Wikipedia description + Unsplash/Wikipedia cover image
- **AI Narratives (optional):** Groq model generates a concise teaser

---

## 🏗️ Technical Architecture

### Frontend Stack
- React 18 (functional components + hooks)
- React Router DOM
- Leaflet.js for maps
- Axios for API calls
- Modern CSS with a small design system

### Backend Stack
- Node.js, Express.js (REST API)
- MongoDB + Mongoose
- Cookie-based sessions
- Joi validation
- bcrypt for secure hashes

### External Integrations
- **OpenRouteService** — routing & nearest (bike/trek profiles)
- **Open-Meteo** — weather (no API key)
- **Nominatim (OSM)** — geocoding
- **Wikipedia REST API** — destination info
- **Unsplash (source endpoint)** — image fallback
- **Groq (optional)** — trip narrative generation

---

## 📁 Project Structure

