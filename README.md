# TripPlanner 🗺️

A modern, AI‑assisted trip‑planning web app that builds realistic hiking and cycling routes, shows a compact 3‑day forecast (starting **tomorrow**), and can generate a short AI travel teaser.

---

## ✨ Features

* **AI Trip Teaser (optional):** Groq model crafts a concise intro for each trip.
* **Real Routes:** OpenRouteService (ORS) for bike/trek directions over real roads & trails.
* **Interactive Maps:** Leaflet.js for smooth route visualization.
* **Weather:** Open‑Meteo 3‑day forecast.
* **Auth:** Secure registration & login.
* **Trip History:** Save trips and revisit them later.
* **Clean UI:** Card‑based, responsive layout.

---

## 🧠 What it Generates

* **Hiking (trek):** Single‑day loop, about **5–15 km**, start ≈ end.
* **Cycling (bike):** Two‑day point‑to‑point, up to **60 km/day** (≤ 120 km total).

---

## 🏗️ Project Structure

```
travel-planner/
├─ server/                     # Express API + MongoDB
│  ├─ config/                  # DB / session config
│  ├─ middleware/              # authRequired, etc.
│  ├─ models/                  # User, Trip
│  ├─ routes/                  # /api/auth, /api/trips
│  ├─ services/                # geo, routePlan, weather, placeInfo, images
│  └─ server.js                # App entry
├─ client/                     # React (Vite)
│  ├─ src/
│  │  ├─ components/           # MapView, WeatherPanel, etc.
│  │  ├─ pages/                # Planner, History, ModernAuthPage, Login, Register
│  │  ├─ services/             # api.js (Axios)
│  │  └─ styles/               # designSystem.css
│  └─ index.html
└─ README.md
```

---

## 🚀 Tech Stack

**Frontend:** React 18, React Router, Leaflet.js, Axios, Vite, modern CSS

**Backend:** Node.js, Express.js, MongoDB (Mongoose), sessions, Joi, bcrypt

**External APIs:** ORS (routing), Open‑Meteo (weather), Nominatim (geocoding), Wikipedia + Unsplash fallback (images), Groq (optional AI teaser)

---

## 📋 Prerequisites

* Node.js **v18+**
* npm (or yarn/pnpm)
* MongoDB (local or cloud)
* API key for **OpenRouteService** (required)
* Groq API key (optional, for AI teaser)

---

# Environment Variables (.env)

Use **two** files: one for the backend (`server/.env`) and one for the frontend (`client/.env`). Copy the templates below and replace placeholders with your own values.

---

## `server/.env`

```
# Server
PORT=5000
CORS_ORIGIN=<your-frontend-url> # your frontend origin

# Database (choose YOUR own connection string)
MONGODB_URI=<your-mongodb-connection-string>

# Authentication
SESSION_SECRET=<generate-a-long-random-string>
JWT_SECRET=<generate-a-long-random-string>

# External APIs
ORS_API_KEY=<your-openrouteservice-api-key>     # required
GROQ_API_KEY=<your-groq-api-key-optional>       # optional (AI narratives)
```

---

## `client/.env`

> **Vite note:** only variables prefixed with `VITE_` are exposed to the client.

```
VITE_API_BASE_URL=<your-backend-url>  # e.g. http://localhost:5000
VITE_APP_NAME=Travel Planner          # feel free to rename
```

---

### Important

* Do **not** commit real secrets. Commit a `server/.env.example` and `client/.env.example` with placeholders instead.
* Keep secrets **only** in `server/.env`. The client `.env` is public by design.
* If you change the frontend origin or backend port, update `CORS_ORIGIN` and `VITE_API_BASE_URL` accordingly.

---

## 🛠️ Installation & Setup

**1) Clone**

```bash
git clone <your-repo-url>
cd travel-planner
```

**2) Backend**

```bash
cd server
cp .env.example .env   # if present, otherwise create .env as above
npm install
npm start              # starts Express on :5000
```

**3) Frontend (new terminal)**

```bash
cd client
cp .env.example .env   # if present, otherwise create .env as above
npm install
npm start              # starts Vite dev server on :5173
```

**4) (Optional) Run MongoDB with Docker**

```bash
# from project root
docker compose up -d
# if you use the dockerized DB, set in server/.env:
# MONGODB_URI=mongodb://root:example@localhost:27017/travel_planner?authSource=admin
```

**Default URLs**

* Frontend: [http://localhost:5173](http://localhost:5173)
* Backend API: [http://localhost:5000](http://localhost:5000)

---

## 📱 How to Use

**1. Sign up / Sign in**

* Create an account or log in to access the planner.
* A secure cookie/session is used for authenticated requests.

**2. Plan a Trip**

* Go to **Planner**
* Enter a destination (city/area/landmark)
* Choose **Hiking** (5–15 km loop) or **Cycling** (2 days, ≤ 60 km/day)
* Click **Create Route**

**3. What happens behind the scenes**

* **Route Planning:** ORS computes a realistic route and daily distances
* **Weather:** A compact 3‑day forecast starting **tomorrow** is fetched
* **AI Teaser (optional):** Groq generates a short narrative
* **Images & Info:** Wikipedia description + cover image (with Unsplash fallback)

**4. Save & revisit**

* Save the trip with a custom name and short description (server limits apply)
* Open **History** to revisit saved trips, view the map, stats, and current forecast

---

## 📡 Key API Endpoints (Server)

**Auth**

* `POST /api/auth/register` — create account
* `POST /api/auth/login` — authenticate
* `POST /api/auth/logout` — end session
* `GET  /api/auth/me` — current user

**Trips**

* `POST /api/trips/plan` — generate a route

  * body: `{ city: string, type: "bike" | "trek" }`
* `POST /api/trips/ai/narrative` — AI teaser

  * body: `{ city, type, dayDistances: number[] }`
* `GET  /api/trips` — list user trips
* `GET  /api/trips/:id` — get a saved trip
* `POST /api/trips/save` — save a trip

  * body: `{ name, type, coords, dayDistances, description, cover }`
* `GET  /api/trips/place-photo?city=...` — best‑effort cover image

> Notes: ORS key is **required** for `/plan`; Groq is **optional** and app degrades gracefully; Open‑Meteo requires **no** key.

---

## 🧩 Tips

* If you see CORS errors, ensure `CORS_ORIGIN` in `server/.env` is exactly your frontend origin (default `http://localhost:5173`).
* If `/plan` fails, verify your **ORS\_API\_KEY** and that your destination has routable roads/trails.
* Forecast begins **tomorrow** by design (to avoid partial “today” data).
* Missing images? Some places lack Wikipedia images; Unsplash key is optional fallback.

---

## 📣 Credits

OpenRouteService • Open‑Meteo • OpenStreetMap/Nominatim • Wikipedia • Unsplash • Groq • Leaflet.js
