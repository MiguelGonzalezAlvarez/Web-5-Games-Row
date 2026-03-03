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
from app.services.football_providers import get_provider, FootballDataProvider

MANCHESTER_UNITED_ID = settings.MANCHESTER_UNITED_TEAM_ID


DEMO_STANDINGS = [
    PremierLeagueStanding(position=1, team_id=57, team_name="Arsenal FC", team_short_name="Arsenal", team_crest="https://crests.football-data.org/57.png", played_games=27, won=18, draw=6, lost=3, points=60, goals_for=55, goals_against=25, goal_difference=30, form="WWWWD"),
    PremierLeagueStanding(position=2, team_id=65, team_name="Manchester City FC", team_short_name="Man City", team_crest="https://crests.football-data.org/65.png", played_games=27, won=17, draw=5, lost=5, points=56, goals_for=58, goals_against=30, goal_difference=28, form="WWLWW"),
    PremierLeagueStanding(position=3, team_id=66, team_name="Manchester United FC", team_short_name="Man United", team_crest="https://crests.football-data.org/66.png", played_games=27, won=13, draw=8, lost=6, points=47, goals_for=42, goals_against=32, goal_difference=10, form="WWDWW"),
    PremierLeagueStanding(position=4, team_id=64, team_name="Liverpool FC", team_short_name="Liverpool", team_crest="https://crests.football-data.org/64.png", played_games=27, won=16, draw=5, lost=6, points=53, goals_for=52, goals_against=28, goal_difference=24, form="LWWWW"),
    PremierLeagueStanding(position=5, team_id=61, team_name="Chelsea FC", team_short_name="Chelsea", team_crest="https://crests.football-data.org/61.png", played_games=27, won=14, draw=6, lost=7, points=48, goals_for=45, goals_against=30, goal_difference=15, form="WWLWW"),
    PremierLeagueStanding(position=6, team_id=62, team_name="Tottenham Hotspur FC", team_short_name="Spurs", team_crest="https://crests.football-data.org/47.png", played_games=27, won=13, draw=5, lost=9, points=44, goals_for=48, goals_against=40, goal_difference=8, form="WLWWL"),
    PremierLeagueStanding(position=7, team_id=58, team_name="Aston Villa FC", team_short_name="Aston Villa", team_crest="https://crests.football-data.org/58.png", played_games=27, won=12, draw=6, lost=9, points=42, goals_for=40, goals_against=35, goal_difference=5, form="DLLWW"),
    PremierLeagueStanding(position=8, team_id=60, team_name="Newcastle United FC", team_short_name="Newcastle", team_crest="https://crests.football-data.org/67.png", played_games=27, won=11, draw=7, lost=9, points=40, goals_for=38, goals_against=38, goal_difference=0, form="WLDWL"),
    PremierLeagueStanding(position=9, team_id=59, team_name="Brighton & Hove Albion FC", team_short_name="Brighton", team_crest="https://crests.football-data.org/397.png", played_games=27, won=10, draw=8, lost=9, points=38, goals_for=41, goals_against=40, goal_difference=1, form="WDWDL"),
    PremierLeagueStanding(position=10, team_id=63, team_name="Fulham FC", team_short_name="Fulham", team_crest="https://crests.football-data.org/63.png", played_games=27, won=10, draw=6, lost=11, points=36, goals_for=35, goals_against=38, goal_difference=-3, form="LWWDL"),
    PremierLeagueStanding(position=11, team_id=354, team_name="Crystal Palace FC", team_short_name="Crystal Palace", team_crest="https://crests.football-data.org/52.png", played_games=27, won=9, draw=8, lost=10, points=35, goals_for=30, goals_against=35, goal_difference=-5, form="WDWDL"),
    PremierLeagueStanding(position=12, team_id=56, team_name="Brentford FC", team_short_name="Brentford", team_crest="https://crests.football-data.org/402.png", played_games=27, won=9, draw=6, lost=12, points=33, goals_for=38, goals_against=40, goal_difference=-2, form="LWDLW"),
]


DEMO_MATCHES = [
    PremierLeagueMatch(match_id=999001, utc_date="2026-03-07T15:00:00Z", status="SCHEDULED", matchday=28, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Arsenal FC", away_team_short="Arsenal", away_team_crest="https://crests.football-data.org/57.png", home_score=0, away_score=0, is_manchester_united=True),
    PremierLeagueMatch(match_id=999002, utc_date="2026-03-01T15:00:00Z", status="FINISHED", matchday=27, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Everton FC", away_team_short="Everton", away_team_crest="https://crests.football-data.org/58.png", home_score=2, away_score=1, is_manchester_united=True),
    PremierLeagueMatch(match_id=999003, utc_date="2026-02-22T15:00:00Z", status="FINISHED", matchday=26, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Tottenham Hotspur FC", away_team_short="Spurs", away_team_crest="https://crests.football-data.org/47.png", home_score=3, away_score=2, is_manchester_united=True),
    PremierLeagueMatch(match_id=999004, utc_date="2026-02-15T15:00:00Z", status="FINISHED", matchday=25, home_team="Fulham FC", home_team_short="Fulham", home_team_crest="https://crests.football-data.org/63.png", away_team="Manchester United FC", away_team_short="Man United", away_team_crest="https://crests.football-data.org/66.png", home_score=1, away_score=2, is_manchester_united=True),
    PremierLeagueMatch(match_id=999005, utc_date="2026-02-08T17:30:00Z", status="FINISHED", matchday=24, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Leicester City FC", away_team_short="Leicester", away_team_crest="https://crests.football-data.org/46.png", home_score=1, away_score=0, is_manchester_united=True),
    PremierLeagueMatch(match_id=999006, utc_date="2026-02-01T15:00:00Z", status="FINISHED", matchday=23, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="West Ham United FC", away_team_short="West Ham", away_team_crest="https://crests.football-data.org/56.png", home_score=2, away_score=0, is_manchester_united=True),
    PremierLeagueMatch(match_id=999007, utc_date="2026-01-25T15:00:00Z", status="FINISHED", matchday=22, home_team="Brighton & Hove Albion FC", home_team_short="Brighton", home_team_crest="https://crests.football-data.org/397.png", away_team="Manchester United FC", away_team_short="Man United", away_team_crest="https://crests.football-data.org/66.png", home_score=1, away_score=3, is_manchester_united=True),
    PremierLeagueMatch(match_id=999008, utc_date="2026-01-18T15:00:00Z", status="FINISHED", matchday=21, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Southampton FC", away_team_short="Southampton", away_team_crest="https://crests.football-data.org/38.png", home_score=4, away_score=0, is_manchester_united=True),
    PremierLeagueMatch(match_id=999009, utc_date="2026-01-11T15:00:00Z", status="FINISHED", matchday=20, home_team="Liverpool FC", home_team_short="Liverpool", home_team_crest="https://crests.football-data.org/64.png", away_team="Manchester United FC", away_team_short="Man United", away_team_crest="https://crests.football-data.org/66.png", home_score=2, away_score=1, is_manchester_united=True),
    PremierLeagueMatch(match_id=999010, utc_date="2026-01-04T15:00:00Z", status="FINISHED", matchday=19, home_team="Manchester United FC", home_team_short="Man United", home_team_crest="https://crests.football-data.org/66.png", away_team="Manchester City FC", away_team_short="Man City", away_team_crest="https://crests.football-data.org/65.png", home_score=1, away_score=1, is_manchester_united=True),
]


class MemoryCache:
    """Simple in-memory cache with TTL"""
    
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


def set_demo_mode(enabled: bool):
    """Enable or disable demo mode"""
    global DEMO_MODE
    DEMO_MODE = enabled
    cache.clear()
    logger.info(f"Demo mode {'enabled' if enabled else 'disabled'}")


def is_demo_mode() -> bool:
    """Check if demo mode is enabled"""
    return DEMO_MODE


def set_provider(provider_name: str):
    """Set the football data provider"""
    global CURRENT_PROVIDER
    CURRENT_PROVIDER = get_provider(provider_name)
    cache.clear()
    logger.info(f"Football data provider set to: {provider_name}")


def get_current_provider() -> FootballDataProvider:
    """Get the current football data provider"""
    global CURRENT_PROVIDER
    if CURRENT_PROVIDER is None:
        CURRENT_PROVIDER = get_provider()
    return CURRENT_PROVIDER


class FootballAPIService:
    def __init__(self):
        self._provider: Optional[FootballDataProvider] = None
    
    @property
    def provider(self) -> FootballDataProvider:
        if self._provider is None:
            self._provider = get_current_provider()
        return self._provider
    
    @provider.setter
    def provider(self, value: FootballDataProvider):
        self._provider = value

    async def get_standings(self, use_cache: bool = True) -> List[PremierLeagueStanding]:
        """Get Premier League standings with caching"""
        
        if DEMO_MODE:
            logger.info("Returning demo standings")
            return DEMO_STANDINGS
        
        cache_key = "standings"
        
        if use_cache:
            cached = cache.get(cache_key)
            if cached:
                logger.info("Returning cached standings")
                return cached
        
        try:
            standings = await self.provider.get_standings()
            cache.set(cache_key, standings, ttl_seconds=300)
            return standings
        except Exception as e:
            logger.error(f"Error fetching standings: {e}")
            raise Exception(f"Failed to fetch standings: {e}")

    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches"""
        
        if DEMO_MODE:
            logger.info("Returning demo matches")
            return DEMO_MATCHES
        
        cache_key = f"matches_{matchday or 'all'}"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        try:
            matches = await self.provider.get_matches(matchday=matchday)
            cache.set(cache_key, matches, ttl_seconds=180)
            return matches
        except Exception as e:
            logger.error(f"Error fetching matches: {e}")
            raise Exception(f"Failed to fetch matches: {e}")

    async def get_manchester_united_matches(self, limit: int = 10) -> List[PremierLeagueMatch]:
        """Get Manchester United recent matches"""
        all_matches = await self.get_matches()
        mu_matches = [
            m for m in all_matches if m.is_manchester_united
        ]
        return mu_matches[:limit]

    async def get_next_manchester_united_match(self) -> Optional[PremierLeagueMatch]:
        """Get next Manchester United match"""
        cache_key = "next_mu_match"
        
        cached = cache.get(cache_key)
        if cached:
            return cached
        
        all_matches = await self.get_matches()
        for match in all_matches:
            if match.is_manchester_united and match.status == "SCHEDULED":
                cache.set(cache_key, match, ttl_seconds=3600)
                return match
        return None

    async def calculate_current_streak(self) -> CurrentStreak:
        """Calculate Manchester United's current winning streak"""
        matches = await self.get_manchester_united_matches(limit=20)

        sorted_matches = sorted(matches, key=lambda x: x.utc_date, reverse=True)

        current_streak = 0
        streak_start_date = None
        last_result = None
        
        wins_needed = 5

        for match in sorted_matches:
            if match.status != "FINISHED":
                continue

            home_name = match.home_team.lower() if match.home_team else ""
            away_name = match.away_team.lower() if match.away_team else ""
            is_home = "manchester united" in home_name
            is_away = "manchester united" in away_name
            
            if is_home:
                if match.home_score > match.away_score:
                    result = "W"
                elif match.home_score < match.away_score:
                    result = "L"
                else:
                    result = "D"
            elif is_away:
                if match.away_score > match.home_score:
                    result = "W"
                elif match.away_score < match.home_score:
                    result = "L"
                else:
                    result = "D"
            else:
                continue

            if result == "W":
                if current_streak == 0:
                    streak_start_date = match.utc_date
                current_streak += 1
            else:
                break

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
        """Get historical winning streaks for analysis"""
        matches = await self.get_manchester_united_matches(limit=100)
        
        all_streaks = []
        current_streak = 0
        streak_start = None
        
        sorted_matches = sorted(matches, key=lambda x: x.utc_date)
        
        for match in sorted_matches:
            if match.status != "FINISHED":
                continue
                
            if match.home_team == "Manchester United":
                result = "W" if match.home_score > match.away_score else "L" if match.home_score < match.away_score else "D"
            else:
                result = "W" if match.away_score > match.home_score else "L" if match.away_score < match.home_score else "D"
            
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
        
        if current_streak > 0:
            all_streaks.append({
                "length": current_streak,
                "start": streak_start,
                "end": None
            })
        
        all_streaks.sort(key=lambda x: x["length"], reverse=True)
        
        return {
            "longest_streak": all_streaks[0]["length"] if all_streaks else 0,
            "total_streaks": len(all_streaks),
            "top_streaks": all_streaks[:5],
            "streaks_of_3_or_more": len([s for s in all_streaks if s["length"] >= 3])
        }

    async def get_challenge_status(self) -> ChallengeStatus:
        """Get the current challenge status"""
        challenge_start = datetime.fromisoformat(
            settings.HAIRCUT_CHALLENGE_START_DATE.replace("Z", "+00:00")
        )
        
        days_since_start = (datetime.now(challenge_start.tzinfo) - challenge_start).days
        
        streak_info = await self.calculate_current_streak()
        next_match = await self.get_next_manchester_united_match()
        
        motivational_messages = {
            0: "The haircut awaits... #StillWaiting",
            1: "One down, four to go! Keep believing! 💪",
            2: "Two in a row! History is being made! 📈",
            3: "Three wins! The end is near! ✂️",
            4: "FOUR! One more! ONE MORE! AAAAAHHH! 😱",
            5: "FREEDOM! The haircut is finally happening! 🎉",
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
