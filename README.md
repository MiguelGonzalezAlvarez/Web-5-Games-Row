# 5 Games in a Row - Manchester United Haircut Challenge Tracker

A web application tracking Frank Ilett's (@TheUnitedStrand) viral haircut challenge - he won't cut his hair until Manchester United wins 5 games in a row!

## 🏗 Architecture

```
5-games-row/
├── backend/               # FastAPI Python backend
│   ├── app/
│   │   ├── api/           # API endpoints
│   │   ├── core/          # Config, security, logging
│   │   ├── db/            # Database setup
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   └── services/      # Business logic + caching
│   └── tests/            # Unit tests
│
└── frontend/              # Astro + React frontend
    ├── src/
    │   ├── components/    # React components
    │   ├── pages/        # Astro pages
    │   ├── stores/       # Zustand state
    │   ├── styles/       # Global CSS
    │   ├── utils/        # Helpers, constants, API
    │   └── __tests__/    # Component tests
    └── public/           # Static assets + PWA
```

## 🛠 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Astro 4.x + React 18 |
| Backend | FastAPI (Python 3.11) |
| Database | SQLite (dev) / PostgreSQL (prod) |
| API Data | football-data.org (free tier) |
| Styling | CSS Modules |
| State | Zustand |
| Caching | In-memory cache with TTL |
| Animations | Framer Motion |
| Testing | pytest (backend), Vitest (frontend) |
| DevOps | Docker, GitHub Actions |

## ✨ Features

1. **Haircut Counter** - Real-time tracking of days since challenge started (Oct 5, 2024)
2. **Streak Tracker** - Shows Manchester United's current winning streak
3. **League Table** - Live Premier League standings with MUFC highlighted
4. **Match History** - Recent Manchester United results
5. **Haircut Simulator** - Visual simulation of hair growth over time
6. **Match Predictor** - Predict match scores and track accuracy
7. **Historical Stats** - Analysis of United's winning streaks
8. **Community Feed** - Share photos and support the challenge
9. **Smart Caching** - In-memory cache to reduce API calls
10. **Animations** - Smooth framer-motion animations
11. **PWA Ready** - Installable as a native app with offline support
12. **Docker Support** - Containerized deployment
13. **CI/CD** - Automated testing and deployment
14. **Unit Tests** - Comprehensive test coverage

## 🚀 Quick Start

### Prerequisites

- Python 3.11+
- Node.js 18+
- Docker & Docker Compose (optional)
- API key from [football-data.org](https://football-data.org)

### Option 1: Docker Compose (Recommended)

```bash
# Clone the repository
cd 5-games-row

# Set environment variables
cp backend/.env.example backend/.env
# Edit .env and add your FOOTBALL_API_KEY

# Run with Docker
docker-compose up --build
```

The app will be available at:
- Frontend: http://localhost:4321
- Backend API: http://localhost:8000

### Option 2: Manual Setup

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Install test dependencies
pip install pytest pytest-asyncio

# Copy environment variables
cp .env.example .env
# Edit .env and add your FOOTBALL_API_KEY

# Run the server
uvicorn main:app --reload

# Run tests
pytest tests/
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Install test dependencies
npm install --save-dev vitest @testing-library/react @testing-library/user-event jsdom

# Run development server
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linter
npm run lint
```

## 📡 API Endpoints

### Football
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/football/standings` | Premier League standings |
| GET | `/api/v1/football/matches` | All matches |
| GET | `/api/v1/football/matches/manchester-united` | MUFC matches |
| GET | `/api/v1/football/challenge/status` | Challenge status |
| GET | `/api/v1/football/streak/current` | Current winning streak |
| GET | `/api/v1/football/streak/history` | Historical streaks |

### Community
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/community/posts` | Get all posts |
| POST | `/api/v1/community/posts` | Create a post |
| POST | `/api/v1/community/posts/{id}/like` | Like a post |
| POST | `/api/v1/community/posts/{id}/comments` | Add comment |

### Auth
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/community/auth/register` | Register user |
| POST | `/api/v1/community/auth/login` | Login user |

## 🐳 Docker Commands

```bash
# Build and start
docker-compose up -d

# View logs
docker-compose logs -f

# Stop
docker-compose down

# Rebuild
docker-compose build --no-cache
```

## 🧪 Running Tests

### Backend Tests
```bash
cd backend
pytest tests/ -v
pytest tests/ --cov=app
```

### Frontend Tests
```bash
cd frontend
npm test
npm run test:coverage
```

## 📁 Project Structure

```
5-games-row/
├── .github/workflows/     # CI/CD pipelines
├── backend/
│   ├── app/
│   │   ├── api/v1/       # API routes
│   │   ├── core/         # Config, security
│   │   ├── db/           # Database
│   │   ├── models/       # SQLAlchemy
│   │   ├── schemas/      # Pydantic
│   │   └── services/     # Business logic
│   ├── tests/            # Unit tests
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── public/           # Static assets + PWA
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Astro pages
│   │   ├── styles/      # CSS
│   │   ├── utils/       # Helpers, API, constants
│   │   └── __tests__/  # Tests
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── vitest.config.ts
│   └── package.json
├── docker-compose.yml
└── README.md
```

## 📝 License

MIT License - Feel free to use this for learning or personal projects!

## ⚠️ Disclaimer

This project is not affiliated with Manchester United FC, football-data.org, or Frank Ilett. It's a fan project created for educational purposes.
