from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    # App
    APP_NAME: str = "5 Games in a Row API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    
    # Database
    DATABASE_URL: str = "sqlite:///./5gamesrow.db"
    
    # Football Data Provider (default: api-football)
    FOOTBALL_DATA_PROVIDER: str = "api-football"
    
    # football-data.org API (optional - for fallback)
    FOOTBALL_API_KEY: str = ""
    FOOTBALL_API_BASE_URL: str = "https://api.football-data.org/v4"
    
    # api-football.com API (get free key at https://www.api-football.com)
    # 100 requests/day on free tier
    API_FOOTBALL_KEY: str = ""
    API_FOOTBALL_BASE_URL: str = "https://v3.football.api-sports.io"
    
    # Redis (optional)
    REDIS_URL: str = "redis://localhost:6379"
    
    # JWT
    SECRET_KEY: str = "your-secret-key-change-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # CORS
    BACKEND_CORS_ORIGINS: list[str] = ["*"]
    
    # Challenge dates
    HAIRCUT_CHALLENGE_START_DATE: str = "2024-10-05"
    MANCHESTER_UNITED_TEAM_ID: int = 66  # ID from football-data.org
    
    # API-Football uses different team ID for Manchester United
    API_FOOTBALL_MANCHESTER_UNITED_ID: int = 33
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
