import httpx
from abc import ABC, abstractmethod
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


class FootballDataProvider(ABC):
    """Abstract base class for football data providers"""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name"""
        pass
    
    @property
    @abstractmethod
    def is_free(self) -> bool:
        """Whether this provider has a free tier"""
        pass
    
    @abstractmethod
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings"""
        pass
    
    @abstractmethod
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches"""
        pass


class FootballDataOrgProvider(FootballDataProvider):
    """Provider using football-data.org API"""
    
    def __init__(self):
        self.base_url = settings.FOOTBALL_API_BASE_URL
        self.api_key = settings.FOOTBALL_API_KEY
        self.headers = {"X-Auth-Token": self.api_key}
    
    @property
    def name(self) -> str:
        return "football-data.org"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.base_url}/competitions/PL/standings",
                    headers=self.headers,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()

                standings = []
                for standing in data.get("standings", []):
                    if standing.get("type") == "TOTAL":
                        for entry in standing.get("table", []):
                            standings.append(
                                PremierLeagueStanding(
                                    position=entry.get("position"),
                                    team_id=entry.get("team", {}).get("id"),
                                    team_name=entry.get("team", {}).get("name"),
                                    team_short_name=entry.get("team", {}).get("shortName"),
                                    team_crest=entry.get("team", {}).get("crest"),
                                    played_games=entry.get("playedGames"),
                                    won=entry.get("won"),
                                    draw=entry.get("draw"),
                                    lost=entry.get("lost"),
                                    points=entry.get("points"),
                                    goals_for=entry.get("goalsFor"),
                                    goals_against=entry.get("goalsAgainst"),
                                    goal_difference=entry.get("goalDifference"),
                                    form=entry.get("form"),
                                )
                            )
                        break
                return standings

            except httpx.HTTPError as e:
                logger.error(f"Error fetching standings from football-data.org: {e}")
                raise Exception(f"Failed to fetch standings from API: {e}")
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.base_url}/competitions/PL/matches"
                params = {}
                if matchday:
                    params["matchday"] = matchday

                response = await client.get(
                    url,
                    headers=self.headers,
                    params=params,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()

                matches = []
                for match in data.get("matches", []):
                    home_team = match.get("homeTeam", {})
                    away_team = match.get("awayTeam", {})
                    score = match.get("score", {}).get("fullTime", {})

                    is_mu = (
                        home_team.get("id") == MANCHESTER_UNITED_ID
                        or away_team.get("id") == MANCHESTER_UNITED_ID
                    )

                    matches.append(
                        PremierLeagueMatch(
                            match_id=match.get("id"),
                            utc_date=match.get("utcDate"),
                            status=match.get("status"),
                            matchday=match.get("matchday"),
                            home_team=home_team.get("name"),
                            home_team_short=home_team.get("shortName"),
                            home_team_crest=home_team.get("crest"),
                            away_team=away_team.get("name"),
                            away_team_short=away_team.get("shortName"),
                            away_team_crest=away_team.get("crest"),
                            home_score=score.get("home") or 0,
                            away_score=score.get("away") or 0,
                            is_manchester_united=is_mu,
                        )
                    )

                return matches

            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from football-data.org: {e}")
                raise Exception(f"Failed to fetch matches from API: {e}")


class TheSportsDBProvider(FootballDataProvider):
    """Provider using TheSportsDB API (free, no API key required)"""
    
    BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"
    
    TEAM_ID_MAP = {
        "Arsenal": 133604,
        "Aston Villa": 133601,
        "Bournemouth": 134301,
        "Brentford": 134355,
        "Brighton": 133619,
        "Burnley": 133623,
        "Chelsea": 133610,
        "Crystal Palace": 133632,
        "Everton": 133615,
        "Fulham": 133600,
        "Leeds United": 133635,
        "Liverpool": 133602,
        "Manchester City": 133613,
        "Manchester United": 133612,
        "Newcastle": 134777,
        "Nottingham Forest": 133720,
        "Sunderland": 133603,
        "Tottenham": 133616,
        "West Ham": 133636,
        "Wolverhampton": 133599,
    }
    
    @property
    def name(self) -> str:
        return "TheSportsDB"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/lookup_all_teams.php",
                    params={"id": 4328},
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                
                teams = data.get("teams", [])
                
                standings = []
                for idx, team in enumerate(teams, 1):
                    team_name = team.get("strTeam", "")
                    team_id = int(team.get("idTeam", 0))
                    
                    standings.append(
                        PremierLeagueStanding(
                            position=idx,
                            team_id=team_id,
                            team_name=team_name,
                            team_short_name=team.get("strTeamShort", team_name),
                            team_crest=team.get("strTeamBadge", ""),
                            played_games=0,
                            won=0,
                            draw=0,
                            lost=0,
                            points=0,
                            goals_for=0,
                            goals_against=0,
                            goal_difference=0,
                            form=None,
                        )
                    )
                
                return standings

            except httpx.HTTPError as e:
                logger.error(f"Error fetching standings from TheSportsDB: {e}")
                raise Exception(f"Failed to fetch standings from TheSportsDB: {e}")
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/eventsnextleague.php",
                    params={"id": 4328},
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                
                events = data.get("events", []) or []
                
                matches = []
                for event in events:
                    home_team = event.get("strHomeTeam", "")
                    away_team = event.get("strAwayTeam", "")
                    
                    is_mu = "Manchester United" in home_team or "Manchester United" in away_team
                    
                    home_score = 0
                    away_score = 0
                    status = "SCHEDULED"
                    
                    if event.get("intHomeScore") is not None:
                        home_score = event.get("intHomeScore", 0)
                        away_score = event.get("intAwayScore", 0)
                        status = "FINISHED"
                    
                    date_str = event.get("dateEventLocal", "")
                    time_str = event.get("strTimeLocal", "")
                    utc_date = f"{date_str}T{time_str}Z" if date_str and time_str else ""
                    
                    matches.append(
                        PremierLeagueMatch(
                            match_id=int(event.get("idEvent", 0)),
                            utc_date=utc_date,
                            status=status,
                            matchday=event.get("intRound", 0),
                            home_team=home_team,
                            home_team_short=event.get("strHomeTeam", ""),
                            home_team_crest=event.get("strHomeTeamBadge", ""),
                            away_team=away_team,
                            away_team_short=event.get("strAwayTeam", ""),
                            away_team_crest=event.get("strAwayTeamBadge", ""),
                            home_score=home_score,
                            away_score=away_score,
                            is_manchester_united=is_mu,
                        )
                    )
                
                return matches

            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from TheSportsDB: {e}")
                raise Exception(f"Failed to fetch matches from TheSportsDB: {e}")


class DemoProvider(FootballDataProvider):
    """Demo provider with static data"""
    
    @property
    def name(self) -> str:
        return "Demo Mode"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        return DEMO_STANDINGS
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        return DEMO_MATCHES


PROVIDERS = {
    "football-data.org": FootballDataOrgProvider,
    "thesportsdb": TheSportsDBProvider,
    "demo": DemoProvider,
}


def get_provider(provider_name: str = None) -> FootballDataProvider:
    """Get a football data provider by name"""
    if provider_name is None:
        provider_name = settings.FOOTBALL_DATA_PROVIDER
    
    provider_class = PROVIDERS.get(provider_name.lower())
    if provider_class is None:
        logger.warning(f"Unknown provider '{provider_name}', using football-data.org")
        provider_class = PROVIDERS["football-data.org"]
    
    return provider_class()
