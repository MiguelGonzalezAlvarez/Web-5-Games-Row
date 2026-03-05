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
    
    @abstractmethod
    async def get_metadata(self) -> dict:
        """Get provider metadata (season, has_logos, etc)."""
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
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "2024-25",
            "has_logos": True,
            "has_standings": True,
            "has_finished_matches": True,
            "description": "Official football-data.org API - accurate Premier League data",
            "data_freshness": "daily",
            "last_updated": "Today",
            "coverage": ["standings", "matches", "teams", "scorers"],
            "api_type": "official",
            "limitations": "Free tier: 10 requests/hour",
            "best_for": "Reliable official data with good balance of features"
        }


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
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "2024-25",
            "has_logos": True,
            "has_standings": True,
            "has_finished_matches": True,
            "description": "TheSportsDB - Free community-driven sports data",
            "data_freshness": "weekly",
            "last_updated": "Recent",
            "coverage": ["standings", "matches", "teams", "players", "venues"],
            "api_type": "community",
            "limitations": "May have incomplete data, calculated standings",
            "best_for": "Multi-season historical data and rich metadata",
            "supports_season_selection": True,
            "available_seasons": ["2024-25", "2023-24", "2022-23"]
        }


class OpenFootballProvider(FootballDataProvider):
    """Provider using OpenFootball GitHub-based data (no API key required).
    
    Data source: https://github.com/openfootball/football.json
    Provides Premier League 2025-26 data.
    """
    
    BASE_URL = "https://raw.githubusercontent.com/openfootball/football.json/master"
    PREMIER_LEAGUE_SEASON = "2025-26"
    PREMIER_LEAGUE_FILE = "en.1.json"
    
    TEAM_NAME_MAPPING = {
        "Liverpool FC": "Liverpool",
        "Manchester City FC": "Manchester City",
        "Manchester United FC": "Manchester United",
        "Arsenal FC": "Arsenal",
        "Chelsea FC": "Chelsea",
        "Tottenham Hotspur FC": "Tottenham Hotspur",
        "Newcastle United FC": "Newcastle United",
        "Manchester United": "Manchester United",
        "Aston Villa FC": "Aston Villa",
        "West Ham United FC": "West Ham United",
        "Wolverhampton Wanderers FC": "Wolverhampton",
        "Brighton & Hove Albion FC": "Brighton",
        "Fulham FC": "Fulham",
        "Crystal Palace FC": "Crystal Palace",
        "Everton FC": "Everton",
        "Brentford FC": "Brentford",
        "AFC Bournemouth": "Bournemouth",
        "Nottingham Forest FC": "Nottingham Forest",
        "Burnley FC": "Burnley",
        "Leeds United FC": "Leeds United",
        "Sunderland AFC": "Sunderland",
    }
    
    @property
    def name(self) -> str:
        return "openfootball"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings from OpenFootball data.
        
        Calculates standings from match results.
        """
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.BASE_URL}/{self.PREMIER_LEAGUE_SEASON}/{self.PREMIER_LEAGUE_FILE}"
                logger.info(f"OpenFootball: Fetching from {url}")
                
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                matches = data.get("matches", [])
                if not matches:
                    logger.warning("OpenFootball: No matches found")
                    return []
                
                # Calculate standings from matches
                standings = self._calculate_standings(matches)
                logger.info(f"OpenFootball: Calculated {len(standings)} standings")
                return standings
                
            except httpx.HTTPError as e:
                logger.error(f"Error fetching from OpenFootball: {e}")
                raise Exception(f"Failed to fetch from OpenFootball: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in OpenFootball: {e}")
                raise
    
    def _calculate_standings(self, matches: List[Dict[str, Any]]) -> List[PremierLeagueStanding]:
        """Calculate standings from match data."""
        teams: Dict[str, Dict[str, Any]] = {}
        
        for match in matches:
            team1 = match.get("team1", "")
            team2 = match.get("team2", "")
            score = match.get("score", {})
            
            # Get final score
            if isinstance(score, dict):
                ft = score.get("ft", [0, 0])
            elif isinstance(score, list):
                ft = score if len(score) == 2 else [0, 0]
            else:
                ft = [0, 0]
            
            home_score = ft[0] if len(ft) >= 1 else 0
            away_score = ft[1] if len(ft) >= 2 else 0
            
            # Initialize teams if needed
            for team in [team1, team2]:
                if team and team not in teams:
                    normalized_name = self.TEAM_NAME_MAPPING.get(team, team.replace(" FC", ""))
                    teams[team] = {
                        "name": normalized_name,
                        "played": 0,
                        "won": 0,
                        "drawn": 0,
                        "lost": 0,
                        "goals_for": 0,
                        "goals_against": 0,
                    }
            
            # Update stats
            if team1 in teams:
                teams[team1]["played"] += 1
                teams[team1]["goals_for"] += home_score
                teams[team1]["goals_against"] += away_score
                if home_score > away_score:
                    teams[team1]["won"] += 1
                elif home_score == away_score:
                    teams[team1]["drawn"] += 1
                else:
                    teams[team1]["lost"] += 1
            
            if team2 in teams:
                teams[team2]["played"] += 1
                teams[team2]["goals_for"] += away_score
                teams[team2]["goals_against"] += home_score
                if away_score > home_score:
                    teams[team2]["won"] += 1
                elif away_score == home_score:
                    teams[team2]["drawn"] += 1
                else:
                    teams[team2]["lost"] += 1
        
        # Convert to standings
        standings = []
        for team_data in teams.values():
            points = team_data["won"] * 3 + team_data["drawn"]
            gd = team_data["goals_for"] - team_data["goals_against"]
            
            standing = PremierLeagueStanding(
                position=0,
                team_id=0,
                team_name=team_data["name"],
                team_short_name=team_data["name"][:3].upper(),
                team_crest="",
                played_games=team_data["played"],
                won=team_data["won"],
                draw=team_data["drawn"],
                lost=team_data["lost"],
                points=points,
                goals_for=team_data["goals_for"],
                goals_against=team_data["goals_against"],
                goal_difference=gd,
                form="",
            )
            standings.append(standing)
        
        # Sort by points, then goal difference, then goals scored
        standings.sort(key=lambda x: (-x.points, -x.goal_difference, -x.goals_for))
        
        # Update positions
        for i, standing in enumerate(standings, 1):
            standing.position = i
        
        return standings
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches from OpenFootball."""
        async with httpx.AsyncClient() as client:
            try:
                url = f"{self.BASE_URL}/{self.PREMIER_LEAGUE_SEASON}/{self.PREMIER_LEAGUE_FILE}"
                
                response = await client.get(url, timeout=30.0)
                response.raise_for_status()
                data = response.json()
                
                matches = data.get("matches", [])
                if not matches:
                    return []
                
                # Normalize matches
                normalized_matches = []
                for match in matches:
                    normalized = self._normalize_match(match)
                    if normalized:
                        normalized_matches.append(normalized)
                
                logger.info(f"OpenFootball: Got {len(normalized_matches)} matches")
                return normalized_matches
                
            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from OpenFootball: {e}")
                raise Exception(f"Failed to fetch matches from OpenFootball: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in OpenFootball get_matches: {e}")
                raise
    
    def _normalize_match(self, match: Dict[str, Any]) -> Optional[PremierLeagueMatch]:
        """Normalize a single match to PremierLeagueMatch schema."""
        try:
            team1 = match.get("team1", "")
            team2 = match.get("team2", "")
            score = match.get("score", {})
            date_str = match.get("date", "")
            time_str = match.get("time", "00:00")
            
            if isinstance(score, dict):
                ft = score.get("ft", [0, 0])
            elif isinstance(score, list):
                ft = score if len(score) == 2 else [0, 0]
            else:
                ft = [0, 0]
            
            home_score = ft[0] if len(ft) >= 1 else 0
            away_score = ft[1] if len(ft) >= 2 else 0
            
            # Parse date
            try:
                match_date = datetime.fromisoformat(date_str) if date_str else datetime.now()
            except:
                match_date = datetime.now()
            
            if time_str:
                try:
                    time_parts = time_str.split(":")
                    match_date = match_date.replace(hour=int(time_parts[0]), minute=int(time_parts[1]))
                except:
                    pass
            
            home_team = self.TEAM_NAME_MAPPING.get(team1, team1.replace(" FC", "")) or ""
            away_team = self.TEAM_NAME_MAPPING.get(team2, team2.replace(" FC", "")) or ""
            
            if not home_team or not away_team:
                return None
            
            return PremierLeagueMatch(
                match_id=abs(hash(f"{date_str}_{home_team}_{away_team}")),
                utc_date=match_date.isoformat(),
                status="FINISHED" if home_score is not None or away_score is not None else "SCHEDULED",
                matchday=int(match.get("round", "").replace("Matchday ", "1")) if match.get("round") else 1,
                home_team=home_team,
                home_team_short=home_team[:3].upper(),
                home_team_crest="",
                away_team=away_team,
                away_team_short=away_team[:3].upper(),
                away_team_crest="",
                home_score=home_score if home_score is not None else 0,
                away_score=away_score if away_score is not None else 0,
                is_manchester_united=(home_team == "Manchester United" or away_team == "Manchester United"),
            )
        except Exception as e:
            logger.debug(f"Error normalizing match: {e}")
            return None
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "2025-26",
            "has_logos": False,
            "has_standings": True,
            "has_finished_matches": True,
            "description": "OpenFootball - GitHub-based data, no API key needed",
            "data_freshness": "weekly",
            "last_updated": "Weekly",
            "coverage": ["standings", "matches", "teams"],
            "api_type": "open_data",
            "limitations": "No team logos, manual data entry",
            "best_for": "Current live season with finished matches only",
            "highlights": ["All matches finished", "Clean data", "No API key needed"]
        }


class ApiFootballProvider(FootballDataProvider):
    """Provider using api-football.com API.
    
    Free tier: 100 requests/day
    Get API key: https://www.api-football.com
    """
    
    PREMIER_LEAGUE_ID = 39  # API-Football uses 39 for Premier League
    
    @property
    def name(self) -> str:
        return "api-football"
    
    @property
    def is_free(self) -> bool:
        return True  # Has free tier
    
    def __init__(self):
        self.api_key = settings.API_FOOTBALL_KEY
        self.base_url = settings.API_FOOTBALL_BASE_URL
        if not self.api_key:
            logger.warning("API-Football: No API key configured")
    
    def _get_headers(self) -> Dict[str, str]:
        return {"x-apisports-key": self.api_key}
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings from api-football."""
        async with httpx.AsyncClient() as client:
            try:
                if not self.api_key:
                    raise Exception("API-Football: No API key configured")
                
                url = f"{self.base_url}/standings"
                params = {
                    "league": self.PREMIER_LEAGUE_ID,
                    "season": 2024,
                }
                
                logger.info(f"API-Football: Fetching standings")
                
                response = await client.get(
                    url, 
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("errors"):
                    logger.error(f"API-Football errors: {data.get('errors')}")
                
                # Normalize standings
                standings = self._normalize_standings(data)
                logger.info(f"API-Football: Got {len(standings)} standings")
                return standings
                
            except httpx.HTTPError as e:
                logger.error(f"Error fetching from API-Football: {e}")
                raise Exception(f"Failed to fetch from API-Football: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in API-Football: {e}")
                raise
    
    def _normalize_standings(self, data: Dict[str, Any]) -> List[PremierLeagueStanding]:
        """Normalize standings from API-Football response."""
        standings = []
        
        try:
            response = data.get("response", [])
            if not response:
                return []
            
            league_data = response[0]
            league = league_data.get("league", {})
            standings_data = league.get("standings", [])
            
            if not standings_data:
                return []
            
            # Standings is a list of groups, each with tables
            for group in standings_data:
                if isinstance(group, list):
                    for table in group:
                        standing = self._parse_standing(table)
                        if standing:
                            standings.append(standing)
                elif isinstance(group, dict):
                    table = group.get("all", {})
                    standing = self._parse_standing(group)
                    if standing:
                        standings.append(standing)
        except Exception as e:
            logger.error(f"Error normalizing standings: {e}")
        
        # Sort by position
        standings.sort(key=lambda x: x.position)
        return standings
    
    def _parse_standing(self, table: Dict[str, Any]) -> Optional[PremierLeagueStanding]:
        """Parse a single standing entry."""
        try:
            team = table.get("team", {})
            
            return PremierLeagueStanding(
                position=table.get("rank", 0),
                team_id=team.get("id", 0),
                team_name=team.get("name", ""),
                team_short_name=team.get("name", "")[:3].upper() if team.get("name") else "",
                team_crest=team.get("logo", ""),
                played_games=table.get("all", {}).get("played", 0),
                won=table.get("all", {}).get("win", 0),
                draw=table.get("all", {}).get("draw", 0),
                lost=table.get("all", {}).get("lose", 0),
                goals_for=table.get("all", {}).get("goals", {}).get("for", 0),
                goals_against=table.get("all", {}).get("goals", {}).get("against", 0),
                goal_difference=table.get("goalsDiff", 0),
                points=table.get("points", 0),
                form=table.get("form", ""),
            )
        except Exception as e:
            logger.debug(f"Error parsing standing: {e}")
            return None
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches from api-football."""
        async with httpx.AsyncClient() as client:
            try:
                if not self.api_key:
                    raise Exception("API-Football: No API key configured")
                
                url = f"{self.base_url}/fixtures"
                params = {
                    "league": self.PREMIER_LEAGUE_ID,
                    "season": 2024,
                }
                if matchday:
                    params["round"] = f"Regular Season - {matchday}"
                
                logger.info(f"API-Football: Fetching matches")
                
                response = await client.get(
                    url,
                    headers=self._get_headers(),
                    params=params,
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                if data.get("errors"):
                    logger.error(f"API-Football errors: {data.get('errors')}")
                
                # Normalize matches
                matches = self._normalize_matches(data)
                logger.info(f"API-Football: Got {len(matches)} matches")
                return matches
                
            except httpx.HTTPError as e:
                logger.error(f"Error fetching matches from API-Football: {e}")
                raise Exception(f"Failed to fetch matches from API-Football: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in API-Football get_matches: {e}")
                raise
    
    def _normalize_matches(self, data: Dict[str, Any]) -> List[PremierLeagueMatch]:
        """Normalize matches from API-Football response."""
        matches = []
        
        try:
            response = data.get("response", [])
            for fixture in response:
                match = self._parse_match(fixture)
                if match:
                    matches.append(match)
        except Exception as e:
            logger.error(f"Error normalizing matches: {e}")
        
        return matches
    
    def _parse_match(self, fixture: Dict[str, Any]) -> Optional[PremierLeagueMatch]:
        """Parse a single match fixture."""
        try:
            league = fixture.get("league", {})
            teams = fixture.get("teams", {})
            goals = fixture.get("goals", {})
            score = fixture.get("score", {})
            fixture_date = fixture.get("fixture", {})
            
            home_team = teams.get("home", {})
            away_team = teams.get("away", {})
            
            # Parse date
            try:
                date_str = fixture_date.get("date", "")
                match_date = datetime.fromisoformat(date_str.replace("Z", "+00:00")) if date_str else datetime.now()
            except:
                match_date = datetime.now()
            
            # Map status
            status_map = {
                "NS": "SCHEDULED",
                "TBD": "SCHEDULED",
                "FT": "FINISHED",
                "POSTPoned": "POSTPONED",
                "CANCELLED": "CANCELLED",
                "IN_PLAY": "IN_PLAY",
                "PAUSED": "PAUSED",
            }
            
            status = status_map.get(fixture.get("status", {}).get("short", ""), "SCHEDULED")
            
            # Get matchday from round
            round_str = league.get("round", "")
            matchday = 1
            if round_str:
                try:
                    matchday = int(round_str.split(" - ")[-1])
                except:
                    pass
            
            home_team_name = home_team.get("name", "") or ""
            away_team_name = away_team.get("name", "") or ""
            home_score_val = goals.get("home")
            away_score_val = goals.get("away")
            
            return PremierLeagueMatch(
                match_id=fixture.get("fixture", {}).get("id", 0) or 0,
                utc_date=match_date.isoformat(),
                status=status,
                matchday=matchday,
                home_team=home_team_name,
                home_team_short=home_team_name[:3].upper() if home_team_name else "",
                home_team_crest=home_team.get("logo", "") or "",
                away_team=away_team_name,
                away_team_short=away_team_name[:3].upper() if away_team_name else "",
                away_team_crest=away_team.get("logo", "") or "",
                home_score=home_score_val if home_score_val is not None else 0,
                away_score=away_score_val if away_score_val is not None else 0,
                is_manchester_united=(home_team_name == "Manchester United" or away_team_name == "Manchester United"),
            )
        except Exception as e:
            logger.debug(f"Error parsing match: {e}")
            return None
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "2024-25",
            "has_logos": True,
            "has_standings": True,
            "has_finished_matches": False,
            "description": "API-Football - 100 requests/day free tier (historical data)",
            "data_freshness": "historical",
            "last_updated": "Season End 2024-25",
            "coverage": ["standings", "matches", "teams", "statistics", "players"],
            "api_type": "commercial",
            "limitations": "100 requests/day, matches show as SCHEDULED but have scores",
            "best_for": "Historical data with team logos and detailed statistics",
            "special_note": "Matches have scores but status shows as SCHEDULED - this is normal for historical data",
            "data_quality": "high"
        }


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
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "Demo",
            "has_logos": True,
            "has_standings": True,
            "has_finished_matches": True,
            "description": "Demo Mode - Static sample data for testing",
            "data_freshness": "static",
            "last_updated": "Always available",
            "coverage": ["standings", "matches", "teams", "scorers", "statistics"],
            "api_type": "demo",
            "limitations": "Sample data only - not real matches",
            "best_for": "Testing the app, demonstrations, development",
            "special_note": "Streak exaggerated to 7 wins for demonstration purposes",
            "data_quality": "demo",
            "is_demo": True
        }


class FixtureDownloadProvider(FootballDataProvider):
    """Provider using FixtureDownload.com API (free, no API key required).
    
    Data source: https://fixturedownload.com/
    Provides Premier League match data in JSON format.
    """
    
    BASE_URL = "https://fixturedownload.com"
    PREMIER_LEAGUE_URL = f"{BASE_URL}/view/json/epl-2024"
    
    TEAM_NAME_MAPPING = {
        "Man Utd": "Manchester United",
        "Man City": "Manchester City",
        "Spurs": "Tottenham Hotspur",
        "Wolves": "Wolverhampton Wanderers",
        "Leicester": "Leicester City",
        "West Ham": "West Ham United",
        "Nott'm Forest": "Nottingham Forest",
        "Brighton": "Brighton & Hove Albion",
    }
    
    @property
    def name(self) -> str:
        return "fixturedownload"
    
    @property
    def is_free(self) -> bool:
        return True
    
    async def get_standings(self) -> List[PremierLeagueStanding]:
        """Get Premier League standings from FixtureDownload.
        
        Note: FixtureDownload doesn't provide standings, so we calculate them
        from match results.
        """
        matches = await self.get_matches()
        
        if not matches:
            return []
        
        # Calculate standings from matches
        team_stats: Dict[str, Dict[str, Any]] = {}
        
        for match in matches:
            for team_key, team_name, is_home in [
                ("home", match.home_team, True),
                ("away", match.away_team, False)
            ]:
                if team_name not in team_stats:
                    team_stats[team_name] = {
                        "played": 0,
                        "won": 0,
                        "drawn": 0,
                        "lost": 0,
                        "goals_for": 0,
                        "goals_against": 0,
                    }
                
                team_stats[team_name]["played"] += 1
                
                if is_home:
                    goals_for = match.home_score or 0
                    goals_against = match.away_score or 0
                else:
                    goals_for = match.away_score or 0
                    goals_against = match.home_score or 0
                
                team_stats[team_name]["goals_for"] += goals_for
                team_stats[team_name]["goals_against"] += goals_against
                
                if goals_for > goals_against:
                    team_stats[team_name]["won"] += 1
                elif goals_for == goals_against:
                    team_stats[team_name]["drawn"] += 1
                else:
                    team_stats[team_name]["lost"] += 1
        
        # Convert to standings
        standings = []
        for i, (team_name, stats) in enumerate(sorted(
            team_stats.items(),
            key=lambda x: (x[1]["won"] * 3 + x[1]["drawn"], x[1]["goals_for"] - x[1]["goals_against"]),
            reverse=True
        )):
            points = stats["won"] * 3 + stats["drawn"]
            standings.append(PremierLeagueStanding(
                position=i + 1,
                team_id=i + 1,
                team_name=team_name,
                team_short_name=team_name[:3].upper() if team_name else "",
                team_crest="",
                played_games=stats["played"],
                won=stats["won"],
                draw=stats["drawn"],
                lost=stats["lost"],
                points=points,
                goals_for=stats["goals_for"],
                goals_against=stats["goals_against"],
                goal_difference=stats["goals_for"] - stats["goals_against"],
            ))
        
        logger.info(f"FixtureDownload: Calculated {len(standings)} standings from {len(matches)} matches")
        return standings
    
    async def get_matches(self, matchday: Optional[int] = None) -> List[PremierLeagueMatch]:
        """Get Premier League matches from FixtureDownload."""
        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(
                    self.PREMIER_LEAGUE_URL,
                    timeout=30.0,
                )
                response.raise_for_status()
                data = response.json()
                
                matches = []
                for match_data in data:
                    try:
                        home_team = match_data.get("HomeTeam", "") or ""
                        away_team = match_data.get("AwayTeam", "") or ""
                        
                        # Map team names
                        home_team = self.TEAM_NAME_MAPPING.get(home_team, home_team)
                        away_team = self.TEAM_NAME_MAPPING.get(away_team, away_team)
                        
                        home_score = match_data.get("HomeTeamScore")
                        away_score = match_data.get("AwayTeamScore")
                        
                        # Parse date
                        date_str = match_data.get("DateUtc", "")
                        if date_str:
                            try:
                                match_date = datetime.fromisoformat(date_str.replace("Z", "+00:00"))
                            except:
                                match_date = datetime.now()
                        else:
                            match_date = datetime.now()
                        
                        # Determine status based on scores
                        if home_score is not None and away_score is not None:
                            status = "FINISHED"
                        else:
                            status = "SCHEDULED"
                        
                        round_number = match_data.get("RoundNumber", 1) or 1
                        
                        match_id = match_data.get("MatchNumber", 0) or 0
                        
                        match = PremierLeagueMatch(
                            match_id=int(match_id) if match_id else 0,
                            utc_date=match_date.isoformat(),
                            status=status,
                            matchday=int(round_number),
                            home_team=home_team,
                            home_team_short=home_team[:3].upper() if home_team else "",
                            home_team_crest="",
                            away_team=away_team,
                            away_team_short=away_team[:3].upper() if away_team else "",
                            away_team_crest="",
                            home_score=home_score if home_score is not None else 0,
                            away_score=away_score if away_score is not None else 0,
                            is_manchester_united=("manchester united" in home_team.lower() or 
                                                 "manchester united" in away_team.lower()),
                        )
                        matches.append(match)
                    except Exception as e:
                        logger.debug(f"Error parsing match: {e}")
                        continue
                
                # Filter by matchday if requested
                if matchday:
                    matches = [m for m in matches if m.matchday == matchday]
                
                logger.info(f"FixtureDownload: Got {len(matches)} matches")
                return matches
                
            except httpx.HTTPError as e:
                logger.error(f"Error fetching from FixtureDownload: {e}")
                raise Exception(f"Failed to fetch matches: {e}")
            except Exception as e:
                logger.error(f"Unexpected error in FixtureDownload: {e}")
                raise
    
    async def get_metadata(self) -> dict:
        return {
            "name": self.name,
            "is_free": self.is_free,
            "season": "2024-25",
            "has_logos": False,
            "has_standings": False,
            "has_finished_matches": True,
            "description": "FixtureDownload - Free daily updated Premier League data",
            "data_freshness": "daily",
            "last_updated": "Daily",
            "coverage": ["matches", "teams"],
            "api_type": "open_data",
            "limitations": "No standings provided, no team logos, calculated standings",
            "best_for": "Daily match results with calculated standings",
            "highlights": ["Daily updates", "All match results", "No API key needed"],
            "data_quality": "medium"
        }


# Provider registry
PROVIDERS = {
    "api-football": ApiFootballProvider,
    "openfootball": OpenFootballProvider,
    "football-data.org": FootballDataOrgProvider,
    "thesportsdb": TheSportsDBProvider,
    "fixturedownload": FixtureDownloadProvider,
    "demo": DemoProvider,
}

# Fallback order (tried in order)
PROVIDER_FALLBACK_ORDER = ["api-football", "openfootball", "football-data.org", "thesportsdb", "fixturedownload", "demo"]


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


async def get_all_providers_metadata() -> List[dict]:
    """Get metadata for all available providers."""
    all_metadata = []
    
    for provider_name in PROVIDERS.keys():
        try:
            provider = get_provider(provider_name)
            metadata = await provider.get_metadata()
            all_metadata.append(metadata)
        except Exception as e:
            logger.warning(f"Failed to get metadata for {provider_name}: {e}")
            all_metadata.append({
                "name": provider_name,
                "is_free": True,
                "season": "Unknown",
                "has_logos": False,
                "has_standings": False,
                "has_finished_matches": False,
                "description": f"Error: {str(e)}"
            })
    
    return all_metadata
