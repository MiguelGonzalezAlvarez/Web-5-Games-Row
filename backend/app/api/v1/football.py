from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.football import (
    PremierLeagueStanding,
    PremierLeagueMatch,
    ChallengeStatus,
)
from app.services.football_service import football_service, set_demo_mode, is_demo_mode, set_provider, get_current_provider

router = APIRouter()


@router.get("/providers")
async def get_providers():
    """Get available football data providers"""
    return {
        "providers": [
            {"name": "football-data.org", "description": "football-data.org (Recommended - latest data, free tier available)", "is_default": True},
            {"name": "thesportsdb", "description": "TheSportsDB (Free, no API key required, may have outdated data)", "is_default": False},
            {"name": "demo", "description": "Demo mode with static data", "is_default": False},
        ],
        "current_provider": get_current_provider().name
    }


@router.post("/providers/{provider_name}")
async def change_provider(provider_name: str):
    """Change the football data provider"""
    valid_providers = ["thesportsdb", "football-data.org", "demo"]
    
    if provider_name.lower() not in valid_providers:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid provider. Available: {', '.join(valid_providers)}"
        )
    
    set_provider(provider_name.lower())
    
    if provider_name.lower() == "demo":
        set_demo_mode(True)
    else:
        set_demo_mode(False)
    
    return {
        "success": True,
        "provider": get_current_provider().name,
        "message": f"Provider changed to {provider_name}"
    }


@router.get("/standings", response_model=list[PremierLeagueStanding])
async def get_standings():
    """Get Premier League standings"""
    return await football_service.get_standings()


@router.get("/matches", response_model=list[PremierLeagueMatch])
async def get_matches(matchday: int | None = None):
    """Get Premier League matches"""
    return await football_service.get_matches(matchday=matchday)


@router.get("/matches/manchester-united", response_model=list[PremierLeagueMatch])
async def get_manchester_united_matches(limit: int = 10):
    """Get Manchester United matches"""
    return await football_service.get_manchester_united_matches(limit=limit)


@router.get("/matches/next")
async def get_next_match():
    """Get next Manchester United match"""
    match = await football_service.get_next_manchester_united_match()
    if not match:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No upcoming match found for Manchester United",
        )
    return match


@router.get("/streak/current")
async def get_current_streak():
    """Get current Manchester United winning streak"""
    return await football_service.calculate_current_streak()


@router.get("/challenge/status", response_model=ChallengeStatus)
async def get_challenge_status():
    """Get current challenge status"""
    return await football_service.get_challenge_status()


@router.get("/streak/history")
async def get_historical_streaks():
    """Get historical winning streaks analysis"""
    return await football_service.get_historical_streaks()


@router.post("/demo-mode")
async def toggle_demo_mode(enabled: bool = True):
    """Toggle demo mode on/off"""
    set_demo_mode(enabled)
    return {"demo_mode": is_demo_mode()}


@router.get("/demo-mode")
async def get_demo_mode_status():
    """Get current demo mode status"""
    return {"demo_mode": is_demo_mode()}
