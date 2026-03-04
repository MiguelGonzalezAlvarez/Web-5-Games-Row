"""
Football data providers with unified normalization.
This module provides multiple providers with fallback support.
"""
import httpx
from abc import ABC, abstractmethod
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from app.core.config import settings
from app.core.logging import logger
from app.schemas.football import (
    PremierLeagueStanding,
    PremierLeagueMatch,
    CurrentStreak,
    ChallengeStatus,
)
from app.services.adapters import (
    DataNormalizer,
    StandingsNormalizer,
    MatchesNormalizer,
)
from app.data.demo_data import DEMO_STANDINGS, DEMO_MATCHES

MANCHESTER_UNITED_ID = settings.MANCHESTER_UNITED_TEAM_ID


class FootballDataProvider(ABC):
    """Abstract base class for football data providers."""
    
    @property
    @abstractmethod
    def name(self) -> str:
        """Provider name."""
        pass
    
    @property
    @abstractmethod
    def is_free(self) -> bool:
        """Whether this provider has a free tier."""
        pass
    
    @abstractmethod
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings."""
        pass
    
    @abstractmethod
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches."""
        pass
    
    def _is_valid_data(self, data: List) -> bool:
        """Check if provider returned valid data."""
        return len(data) > 0


class FootballDataOrgProvider(FootballDataProvider):
    """Provider using football-data.org API."""
    
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
                
                # Use normalizer
                standings = StandingsNormalizer.from_football_data(data)
                
                logger.info(f"FootballDataOrg: Got {len(standings)} standings")
                return standings

            except httpx.HTTPError as e:
                logger.error(f"Error fetching standings from football-data.org: {e}")
                raise Exception(f"Failed to fetch standings from API: {e}")
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise
    
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

                matches = MatchesNormalizer.from_football_data(
                    data.get("matches", [])
                )
                
                logger.info(f"FootballDataOrg: Got {len(matches)} matches")
                return matches

            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from football-data.org: {e}")
                raise Exception(f"Failed to fetch matches from API: {e}")
            except Exception as e:
                logger.error(f"Unexpected error: {e}")
                raise


class TheSportsDBProvider(FootballDataProvider):
    """Provider using TheSportsDB API (free, no API key required)."""
    
    BASE_URL = "https://www.thesportsdb.com/api/v1/json/3"
    PREMIER_LEAGUE_ID = 4328
    MANCHESTER_UNITED_TSDB_ID = 133612
    
    @property
    def name(self) -> str:
        return "thesportsdb"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings from TheSportsDB.
        
        Note: TheSportsDB doesn't provide real standings, so we try to 
        calculate them from match results.
        """
        async with httpx.AsyncClient() as client:
            try:
                # First, get all teams
                teams_response = await client.get(
                    f"{self.BASE_URL}/lookup_all_teams.php",
                    params={"id": self.PREMIER_LEAGUE_ID},
                    timeout=30.0,
                )
                teams_response.raise_for_status()
                teams_data = teams_response.json()
                teams = teams_data.get("teams", []) or []
                
                # Then get recent matches to calculate standings
                matches_response = await client.get(
                    f"{self.BASE_URL}/eventspastleague.php",
                    params={"id": self.PREMIER_LEAGUE_ID},
                    timeout=30.0,
                )
                matches_response.raise_for_status()
                matches_data = matches_response.json()
                matches = matches_data.get("events", []) or []
                
                # Normalize using the adapter
                standings = StandingsNormalizer.from_thesportsdb(teams, matches)
                
                # If we got valid standings with stats, use them
                valid_standings = [s for s in standings if DataNormalizer.has_valid_stats(s)]
                
                if len(valid_standings) >= 10:
                    logger.info(f"TheSportsDB: Got {len(valid_standings)} standings with stats")
                    return valid_standings
                
                # Otherwise, try to get from search
                logger.info("TheSportsDB: Not enough match data, fetching teams directly")
                
                # Get teams by searching for known PL teams
                all_teams = await self._fetch_premier_league_teams(client)
                
                if all_teams:
                    standings = StandingsNormalizer.from_thesportsdb(all_teams, matches)
                    logger.info(f"TheSportsDB: Got {len(standings)} standings from team search")
                    return standings
                
                # If still no data, return empty list (will trigger fallback)
                logger.warning("TheSportsDB: No valid standings data available")
                return []

            except httpx.HTTPError as e:
                logger.error(f"Error fetching standings from TheSportsDB: {e}")
                raise Exception(f"Failed to fetch standings from TheSportsDB: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in TheSportsDB: {e}")
                raise
    
    async def _fetch_premier_league_teams(self, client: httpx.AsyncClient) -> List[Dict[str, Any]]:
        """Fetch Premier League teams by searching."""
        team_names = [
            "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
            "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
            "Liverpool", "Manchester City", "Manchester United", "Newcastle",
            "Nottingham Forest", "Tottenham", "West Ham", "Wolverhampton",
            "Luton Town", "Sheffield United", "Southampton", "Leeds United",
            "Leicester City", "Sunderland", "West Brom"
        ]
        
        all_teams = []
        seen_ids = set()
        
        for team_name in team_names:
            try:
                response = await client.get(
                    f"{self.BASE_URL}/searchteams.php",
                    params={"t": team_name},
                    timeout=10.0,
                )
                data = response.json()
                teams = data.get("teams", []) or []
                
                if teams:
                    team = teams[0]
                    team_id = team.get("idTeam")
                    
                    # Avoid duplicates
                    if team_id and team_id not in seen_ids:
                        # Verify it's Premier League
                        league = team.get("strLeague", "")
                        if "Premier" in league or "Premier" in str(league):
                            all_teams.append(team)
                            seen_ids.add(team_id)
                        # Also check if it's a known PL team by name
                        elif DataNormalizer.normalize_team_name(team.get("strTeam", "")) in [
                            "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
                            "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
                            "Liverpool", "Manchester City", "Manchester United", "Newcastle",
                            "Nottingham Forest", "Tottenham", "West Ham", "Wolves",
                            "Luton Town", "Sheffield United"
                        ]:
                            all_teams.append(team)
                            seen_ids.add(team_id)
                            
            except Exception as e:
                logger.debug(f"Could not fetch team {team_name}: {e}")
                continue
        
        return all_teams
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches from TheSportsDB."""
        async with httpx.AsyncClient() as client:
            try:
                all_matches = []
                
                # Get next matches
                try:
                    next_response = await client.get(
                        f"{self.BASE_URL}/eventsnextleague.php",
                        params={"id": self.PREMIER_LEAGUE_ID},
                        timeout=30.0,
                    )
                    next_data = next_response.json()
                    next_events = next_data.get("events", []) or []
                    all_matches.extend(next_events)
                except Exception as e:
                    logger.debug(f"Could not fetch next matches: {e}")
                
                # Get past matches
                try:
                    past_response = await client.get(
                        f"{self.BASE_URL}/eventspastleague.php",
                        params={"id": self.PREMIER_LEAGUE_ID},
                        timeout=30.0,
                    )
                    past_data = past_response.json()
                    past_events = past_data.get("events", []) or []
                    all_matches.extend(past_events)
                except Exception as e:
                    logger.debug(f"Could not fetch past matches: {e}")
                
                # If still no matches, try MU-specific
                if not all_matches:
                    try:
                        mu_response = await client.get(
                            f"{self.BASE_URL}/eventslast.php",
                            params={"id": self.MANCHESTER_UNITED_TSDB_ID},
                            timeout=30.0,
                        )
                        mu_data = mu_response.json()
                        mu_events = mu_data.get("events", []) or []
                        all_matches.extend(mu_events)
                        
                        mu_next_response = await client.get(
                            f"{self.BASE_URL}/eventsnext.php",
                            params={"id": self.MANCHESTER_UNITED_TSDB_ID},
                            timeout=30.0,
                        )
                        mu_next_data = mu_next_response.json()
                        mu_next_events = mu_next_data.get("events", []) or []
                        all_matches.extend(mu_next_events)
                    except Exception as e:
                        logger.debug(f"Could not fetch MU matches: {e}")
                
                # Normalize matches
                if all_matches:
                    matches = MatchesNormalizer.from_thesportsdb(all_matches)
                    logger.info(f"TheSportsDB: Got {len(matches)} matches")
                    return matches
                
                # Return empty if no data
                logger.warning("TheSportsDB: No matches available")
                return []

            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from TheSportsDB: {e}")
                raise Exception(f"Failed to fetch matches from TheSportsDB: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in TheSportsDB get_matches: {e}")
                raise


class DemoProvider(FootballDataProvider):
    """Demo provider with static data (always works)."""
    
    @property
    def name(self) -> str:
        return "demo"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        return DEMO_STANDINGS
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        return DEMO_MATCHES


# Provider registry
PROVIDERS = {
    "football-data.org": FootballDataOrgProvider,
    "thesportsdb": TheSportsDBProvider,
    "demo": DemoProvider,
}

# Fallback order (tried in order)
PROVIDER_FALLBACK_ORDER = ["football-data.org", "thesportsdb", "demo"]


def get_provider(provider_name: Optional[str] = None) -> FootballDataProvider:
    """Get a football data provider by name."""
    if provider_name is None:
        provider_name = settings.FOOTBALL_DATA_PROVIDER
    
    provider_class = PROVIDERS.get(provider_name.lower())
    if provider_class is None:
        logger.warning(f"Unknown provider '{provider_name}', using demo")
        provider_class = PROVIDERS["demo"]
    
    return provider_class()


def get_provider_with_fallback() -> tuple[FootballDataProvider, str]:
    """Get a working provider with automatic fallback.
    
    Returns:
        tuple: (provider, provider_name)
    """
    last_error = None
    
    for provider_name in PROVIDER_FALLBACK_ORDER:
        try:
            provider = get_provider(provider_name)
            logger.info(f"Trying provider: {provider_name}")
            return provider, provider_name
            
        except Exception as e:
            logger.warning(f"Provider {provider_name} failed: {e}")
            last_error = e
            continue
    
    # If all fail, return demo
    logger.warning("All providers failed, using demo")
    return get_provider("demo"), "demo"
