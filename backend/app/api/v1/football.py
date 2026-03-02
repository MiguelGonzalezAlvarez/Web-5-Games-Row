from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.schemas.football import (
    PremierLeagueStanding,
    PremierLeagueMatch,
    ChallengeStatus,
)
from app.services.football_service import football_service, set_demo_mode, is_demo_mode

router = APIRouter()


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
