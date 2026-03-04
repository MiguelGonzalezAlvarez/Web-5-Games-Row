"""
Football API service with fallback support.
This service provides unified access to football data with automatic fallback.
"""
import httpx
from datetime import datetime, timedelta
from typing import Optional, List, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.football import (
    PremierLeagueStanding,
    PremierLeagueMatch,
    CurrentStreak,
    ChallengeStatus,
)
from app.services.football_providers import (
    get_provider, 
    FootballDataProvider,
    PROVIDER_FALLBACK_ORDER,
    get_provider_with_fallback,
)
from app.services.adapters import DataNormalizer, MatchesNormalizer
from app.data.demo_data import DEMO_STANDINGS, DEMO_MATCHES

MANCHESTER_UNITED_ID = settings.MANCHESTER_UNITED_TEAM_ID


class MemoryCache:
    """Simple in-memory cache with TTL."""
    
    def __init__(self):
        self._cache: dict = {}
    
    def get(self, key: str) -> Optional[Any]:
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.now() < expiry:
                return value
            del self._cache[key]
        return None
    
    def set(self, key: str, value: Any, ttl_seconds: int = 300):
        expiry = datetime.now() + timedelta(seconds=ttl_seconds)
        self._cache[key] = (value, expiry)
    
    def clear(self):
        self._cache.clear()


cache = MemoryCache()

DEMO_MODE = False
CURRENT_PROVIDER: Optional[FootballDataProvider] = None
CURRENT_PROVIDER_NAME = "demo"
LAST_ERROR: Optional[str] = None


def set_demo_mode(enabled: bool):
    """Enable or disable demo mode."""
    global DEMO_MODE
    DEMO_MODE = enabled
    cache.clear()
    logger.info(f"Demo mode {'enabled' if enabled else 'disabled'}")


def is_demo_mode() -> bool:
    """Check if demo mode is enabled."""
    return DEMO_MODE


def set_provider(provider_name: str):
    """Set the football data provider."""
    global CURRENT_PROVIDER, CURRENT_PROVIDER_NAME, DEMO_MODE
    CURRENT_PROVIDER = get_provider(provider_name)
    CURRENT_PROVIDER_NAME = provider_name
    cache.clear()
    
    if provider_name.lower() == "demo":
        DEMO_MODE = True
    else:
        DEMO_MODE = False
        
    logger.info(f"Football data provider set to: {provider_name}")


def get_current_provider() -> FootballDataProvider:
    """Get the current football data provider."""
    global CURRENT_PROVIDER, CURRENT_PROVIDER_NAME
    if CURRENT_PROVIDER is None:
        CURRENT_PROVIDER, CURRENT_PROVIDER_NAME = get_provider_with_fallback()
    return CURRENT_PROVIDER


def get_current_provider_name() -> str:
    """Get the current provider name."""
    global CURRENT_PROVIDER_NAME
    if CURRENT_PROVIDER is None:
        get_current_provider()
    return CURRENT_PROVIDER_NAME


def _has_valid_data(standings: List[PremierLeagueStanding]) -> bool:
    """Check if standings have valid data."""
    if not standings:
        return False
    # Check if any team has points (meaningful data)
    return any(s.points > 0 for s in standings)


def _has_valid_matches(matches: List[PremierLeagueMatch]) -> bool:
    """Check if matches have valid data."""
    if not matches:
        return False
    # Check if any match has results
    return any(m.status == "FINISHED" for m in matches)


class FootballAPIService:
    """Service for accessing football data with fallback support."""
    
    async def get_standings(self, use_cache: bool = True) -> List[PremierLeagueStanding]:
        """Get Premier League standings with fallback support."""
        
        if DEMO_MODE:
            logger.info("Returning demo standings")
            return DEMO_STANDINGS
        
        cache_key = f"standings_{get_current_provider_name()}"
        
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                logger.info("Returning cached standings")
                return cached
        
        # Try with fallback
        last_error = None
        for provider_name in PROVIDER_FALLBACK_ORDER:
            try:
                if provider_name == "demo":
                    logger.info("Falling back to demo standings")
                    return DEMO_STANDINGS
                
                provider = get_provider(provider_name)
                standings = await provider.get_standings()
                
                # Validate data
                if _has_valid_data(standings):
                    cache.set(cache_key, standings, ttl_seconds=300)
                    logger.info(f"Got {len(standings)} standings from {provider_name}")
                    return standings
                else:
                    logger.warning(f"Provider {provider_name} returned invalid standings data")
                    last_error = "Invalid data"
                    continue
                    
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")
                last_error = str(e)
                continue
        
        # All providers failed, return demo
        logger.warning("All providers failed, returning demo standings")
        return DEMO_STANDINGS

    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches with fallback support."""
        
        if DEMO_MODE:
            logger.info("Returning demo matches")
            return DEMO_MATCHES
        
        cache_key = f"matches_{get_current_provider_name()}_{matchday or 'all'}"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        # Try with fallback
        last_error = None
        for provider_name in PROVIDER_FALLBACK_ORDER:
            try:
                if provider_name == "demo":
                    logger.info("Falling back to demo matches")
                    return DEMO_MATCHES
                
                provider = get_provider(provider_name)
                matches = await provider.get_matches(matchday=matchday)
                
                # Validate data
                if _has_valid_matches(matches):
                    cache.set(cache_key, matches, ttl_seconds=180)
                    logger.info(f"Got {len(matches)} matches from {provider_name}")
                    return matches
                else:
                    logger.warning(f"Provider {provider_name} returned invalid matches data")
                    last_error = "Invalid data"
                    continue
                    
            except Exception as e:
                logger.warning(f"Provider {provider_name} failed: {e}")
                last_error = str(e)
                continue
        
        # All providers failed, return demo
        logger.warning("All providers failed, returning demo matches")
        return DEMO_MATCHES

    async def get_manchester_united_matches(self, limit: int = 10) -> List[PremierLeagueMatch]:
        """Get Manchester United recent matches."""
        all_matches = await self.get_matches()
        mu_matches = [
            m for m in all_matches if m.is_manchester_united
        ]
        return mu_matches[:limit]

    async def get_next_manchester_united_match(self) -> Optional[PremierLeagueMatch]:
        """Get next Manchester United match."""
        cache_key = f"next_mu_match_{get_current_provider_name()}"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        all_matches = await self.get_matches()
        
        # Use the normalizer to find next match
        next_match = MatchesNormalizer.get_next_match(all_matches)
        
        if next_match:
            cache.set(cache_key, next_match, ttl_seconds=3600)
        
        return next_match

    async def get_last_manchester_united_match(self) -> Optional[PremierLeagueMatch]:
        """Get last Manchester United match."""
        all_matches = await self.get_matches()
        
        # Use the normalizer to find last match
        return MatchesNormalizer.get_last_match(all_matches)

    def _get_mu_result(self, match: PremierLeagueMatch) -> str:
        """Get Manchester United result from a match (W, L, or D)."""
        home_name = match.home_team or ""
        away_name = match.away_team or ""
        
        is_home = DataNormalizer.is_manchester_united(home_name)
        
        if is_home:
            if match.home_score > match.away_score:
                return "W"
            elif match.home_score < match.away_score:
                return "L"
            else:
                return "D"
        else:
            if match.away_score > match.home_score:
                return "W"
            elif match.away_score < match.home_score:
                return "L"
            else:
                return "D"

    async def calculate_current_streak(self) -> CurrentStreak:
        """Calculate Manchester United's current winning streak.
        
        A winning streak is consecutive wins starting from the most recent match.
        We look for: W-W-W-W-W (5 consecutive wins)
        """
        all_matches = await self.get_matches()
        
        # Filter to MU matches only
        mu_matches = [m for m in all_matches if m.is_manchester_united]
        
        # Filter to finished matches only
        finished_matches = [m for m in mu_matches if m.status == "FINISHED"]
        
        # Sort by date descending (most recent first)
        sorted_matches = sorted(
            finished_matches, 
            key=lambda x: x.utc_date, 
            reverse=True
        )
        
        # Calculate current winning streak
        current_streak = 0
        streak_start_date = None
        last_result = None
        
        for match in sorted_matches:
            result = self._get_mu_result(match)
            
            if result == "W":
                if current_streak == 0:
                    streak_start_date = match.utc_date
                current_streak += 1
            else:
                # Streak broken
                break
            
            # We only need 5 wins for the challenge
            if current_streak >= 5:
                break
        
        last_result = "W" if current_streak > 0 else "L"
        
        next_match = await self.get_next_manchester_united_match()

        return CurrentStreak(
            current_streak=current_streak,
            is_winning=current_streak > 0,
            streak_start_date=streak_start_date,
            last_match_result=last_result,
            next_match={
                "match_id": next_match.match_id,
                "utc_date": next_match.utc_date,
                "home_team": next_match.home_team,
                "away_team": next_match.away_team,
            } if next_match else None,
        )

    async def get_historical_streaks(self) -> dict:
        """Get historical winning streaks for analysis."""
        matches = await self.get_manchester_united_matches(limit=100)
        
        # Filter finished matches
        finished = [m for m in matches if m.status == "FINISHED"]
        
        # Sort by date
        sorted_matches = sorted(finished, key=lambda x: x.utc_date)
        
        all_streaks = []
        current_streak = 0
        streak_start = None
        
        for match in sorted_matches:
            result = self._get_mu_result(match)
            
            if result == "W":
                if current_streak == 0:
                    streak_start = match.utc_date
                current_streak += 1
            else:
                if current_streak > 0:
                    all_streaks.append({
                        "length": current_streak,
                        "start": streak_start,
                        "end": match.utc_date
                    })
                current_streak = 0
                streak_start = None
        
        # Handle ongoing streak
        if current_streak > 0:
            all_streaks.append({
                "length": current_streak,
                "start": streak_start,
                "end": None
            })
        
        # Sort by length descending
        all_streaks.sort(key=lambda x: x["length"], reverse=True)
        
        return {
            "longest_streak": all_streaks[0]["length"] if all_streaks else 0,
            "total_streaks": len(all_streaks),
            "top_streaks": all_streaks[:5],
            "streaks_of_3_or_more": len([s for s in all_streaks if s["length"] >= 3])
        }

    async def get_challenge_status(self) -> ChallengeStatus:
        """Get the current challenge status."""
        challenge_start = datetime.fromisoformat(
            settings.HAIRCUT_CHALLENGE_START_DATE.replace("Z", "+00:00")
        )
        
        days_since_start = (datetime.now(challenge_start.tzinfo) - challenge_start).days
        
        streak_info = await self.calculate_current_streak()
        next_match = await self.get_next_manchester_united_match()
        
        motivational_messages = {
            0: "The haircut awaits... #StillWaiting",
            1: "One down, four to go! Keep believing!",
            2: "Two in a row! History is being made!",
            3: "Three wins! The end is near!",
            4: "FOUR! One more! ONE MORE! AAAAAHHH!",
            5: "FREEDOM! The haircut is finally happening!",
        }

        return ChallengeStatus(
            days_since_start=days_since_start,
            current_streak=streak_info.current_streak,
            target_streak=5,
            is_challenge_complete=streak_info.current_streak >= 5,
            next_match_date=next_match.utc_date if next_match else None,
            next_match_home_team=next_match.home_team if next_match else None,
            next_match_away_team=next_match.away_team if next_match else None,
            motivational_message=motivational_messages.get(
                streak_info.current_streak, motivational_messages[0]
            ),
        )


football_service = FootballAPIService()
