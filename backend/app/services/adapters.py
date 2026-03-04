"""
Data normalization adapters for football providers.
This module provides a unified interface for normalizing data from different APIs.
"""
from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from datetime import datetime
import re
import logging

from app.schemas.football import PremierLeagueStanding, PremierLeagueMatch
from app.data.demo_data import (
    TEAM_NAME_MAPPING,
    SHORT_NAME_MAPPING,
    PREMIER_LEAGUE_TEAMS,
    MANCHESTER_UNITED_NAMES,
    FALLBACK_CRESTS,
)

logger = logging.getLogger(__name__)


class DataNormalizer(ABC):
    """Abstract base class for data normalization."""
    
    @staticmethod
    def normalize_team_name(name: str) -> str:
        """Normalize team name to standard format."""
        if not name:
            return ""
        
        # First check direct mappings
        if name in TEAM_NAME_MAPPING:
            return TEAM_NAME_MAPPING[name]
        
        # Check case-insensitive
        name_lower = name.lower()
        for original, normalized in TEAM_NAME_MAPPING.items():
            if original.lower() == name_lower:
                return normalized
        
        # Return original if no mapping found
        return name
    
    @staticmethod
    def get_short_name(name: str) -> str:
        """Get standardized short name for a team."""
        normalized = DataNormalizer.normalize_team_name(name)
        
        if normalized in SHORT_NAME_MAPPING:
            return SHORT_NAME_MAPPING[normalized]
        
        # Generate short name if not in mapping
        if "Manchester" in normalized:
            return "Man United" if "United" in normalized else "Man City"
        if len(normalized) > 10:
            return normalized[:10].strip()
        return normalized
    
    @staticmethod
    def is_manchester_united(team_name: str) -> bool:
        """Check if team is Manchester United."""
        if not team_name:
            return False
        team_lower = team_name.lower()
        return any(mu.lower() in team_lower for mu in MANCHESTER_UNITED_NAMES)
    
    @staticmethod
    def normalize_date(date_str: str) -> str:
        """Normalize date string to ISO format."""
        if not date_str:
            return ""
        
        # Already ISO format
        if 'T' in date_str and 'Z' in date_str:
            return date_str
        
        # Try to parse and convert
        try:
            # Handle formats like "2024-03-15 15:00:00"
            if ' ' in date_str:
                dt = datetime.strptime(date_str, "%Y-%m-%d %H:%M:%S")
            else:
                dt = datetime.strptime(date_str, "%Y-%m-%d")
            return dt.strftime("%Y-%m-%dT%H:%M:%SZ")
        except ValueError:
            return date_str
    
    @staticmethod
    def normalize_status(status: str) -> str:
        """Normalize match status to standard values."""
        if not status:
            return "SCHEDULED"
        
        status_upper = status.upper()
        
        # Map various status values to standard
        status_mapping = {
            "FINISHED": "FINISHED",
            "SCHEDULED": "SCHEDULED",
            "TIMED": "SCHEDULED",
            "IN_PLAY": "IN_PLAY",
            "PAUSED": "IN_PLAY",
            "POSTPONED": "POSTPONED",
            "CANCELLED": "CANCELLED",
            "SUSPENDED": "SUSPENDED",
            "AWARDED": "FINISHED",
            "NOT_STARTED": "SCHEDULED",
            "0": "SCHEDULED",
            "1": "FINISHED",
            "2": "IN_PLAY",
        }
        
        return status_mapping.get(status_upper, "SCHEDULED")
    
    @staticmethod
    def get_crest_url(team_name: str, primary_crest: str = "") -> str:
        """Get team crest URL with fallback."""
        if primary_crest:
            return primary_crest
        
        normalized = DataNormalizer.normalize_team_name(team_name)
        return FALLBACK_CRESTS.get(normalized, "")
    
    @staticmethod
    def is_valid_standing(standing: PremierLeagueStanding) -> bool:
        """Check if standing has valid data."""
        name = standing.team_name if standing.team_name else ""
        return bool(name and standing.position > 0 and standing.team_id > 0)
    
    @staticmethod
    def has_valid_stats(standing: PremierLeagueStanding) -> bool:
        """Check if standing has valid statistics (not all zeros)."""
        return (
            standing.played_games > 0 or
            standing.points > 0 or
            standing.goals_for > 0
        )
    
    @staticmethod
    def filter_epl_teams(teams: List[Dict[str, Any]], 
                         league_name: str = "English Premier League") -> List[Dict[str, Any]]:
        """Filter teams to only Premier League teams."""
        epl_teams = []
        
        for team in teams:
            team_league = team.get("strLeague", "")
            team_name = team.get("strTeam", "")
            
            # Check if it's EPL
            if league_name.lower() in team_league.lower():
                epl_teams.append(team)
                continue
            
            # Also check if team name matches known EPL teams
            normalized = DataNormalizer.normalize_team_name(team_name)
            if normalized in PREMIER_LEAGUE_TEAMS:
                epl_teams.append(team)
        
        return epl_teams
    
    @staticmethod
    def calculate_goal_difference(goals_for: int, goals_against: int) -> int:
        """Calculate goal difference."""
        return goals_for - goals_against
    
    @staticmethod
    def calculate_points(wins: int, draws: int) -> int:
        """Calculate points (3 for win, 1 for draw)."""
        return (wins * 3) + draws


class StandingsNormalizer:
    """Normalize standings data from various providers."""
    
    @staticmethod
    def from_football_data(data: Dict[str, Any]) -> List[PremierLeagueStanding]:
        """Normalize from football-data.org format."""
        standings = []
        
        # Find TOTAL standing type
        all_standings = data.get("standings", [])
        total_standing = None
        
        for standing in all_standings:
            if standing.get("type") == "TOTAL":
                total_standing = standing
                break
        
        if not total_standing:
            logger.warning("No TOTAL standing found in football-data.org response")
            return standings
        
        table = total_standing.get("table", [])
        
        for entry in table:
            team = entry.get("team", {})
            
            standing = PremierLeagueStanding(
                position=entry.get("position", 0),
                team_id=team.get("id", 0),
                team_name=DataNormalizer.normalize_team_name(team.get("name", "")),
                team_short_name=team.get("shortName", DataNormalizer.get_short_name(team.get("name", ""))),
                team_crest=team.get("crest", ""),
                played_games=entry.get("playedGames", 0),
                won=entry.get("won", 0),
                draw=entry.get("draw", 0),
                lost=entry.get("lost", 0),
                points=entry.get("points", 0),
                goals_for=entry.get("goalsFor", 0),
                goals_against=entry.get("goalsAgainst", 0),
                goal_difference=entry.get("goalDifference", 0),
                form=entry.get("form"),
            )
            standings.append(standing)
        
        return standings
    
    @staticmethod
    def from_thesportsdb(teams: List[Dict[str, Any]], 
                         matches: Optional[List[Dict[str, Any]]] = None) -> List[PremierLeagueStanding]:
        """Normalize from TheSportsDB format.
        
        Since TheSportsDB doesn't provide real standings, we'll calculate
        basic standings from match results if available.
        """
        # First filter to EPL teams
        epl_teams = DataNormalizer.filter_epl_teams(teams)
        
        if not epl_teams:
            # Fallback: use all teams but limit to 20
            epl_teams = teams[:20]
        
        standings = []
        
        # Calculate stats from matches if available
        team_stats: Dict[str, Dict[str, int]] = {}
        
        if matches:
            for match in matches:
                home_team = DataNormalizer.normalize_team_name(
                    match.get("strHomeTeam", "")
                )
                away_team = DataNormalizer.normalize_team_name(
                    match.get("strAwayTeam", "")
                )
                
                home_score = int(match.get("intHomeScore") or 0)
                away_score = int(match.get("intAwayScore") or 0)
                
                status = match.get("strStatus", "")
                if status not in ["Finished", "FINISHED"]:
                    continue
                
                # Initialize teams if needed
                for team in [home_team, away_team]:
                    if team not in team_stats:
                        team_stats[team] = {
                            "played": 0, "won": 0, "draw": 0, 
                            "lost": 0, "gf": 0, "ga": 0
                        }
                
                # Update stats
                team_stats[home_team]["played"] += 1
                team_stats[home_team]["gf"] += home_score
                team_stats[home_team]["ga"] += away_score
                
                team_stats[away_team]["played"] += 1
                team_stats[away_team]["gf"] += away_score
                team_stats[away_team]["ga"] += home_score
                
                # Determine results
                if home_score > away_score:
                    team_stats[home_team]["won"] += 1
                    team_stats[away_team]["lost"] += 1
                elif home_score < away_score:
                    team_stats[home_team]["lost"] += 1
                    team_stats[away_team]["won"] += 1
                else:
                    team_stats[home_team]["draw"] += 1
                    team_stats[away_team]["draw"] += 1
        
        # Create standings from teams
        for idx, team in enumerate(epl_teams, 1):
            team_name = DataNormalizer.normalize_team_name(
                team.get("strTeam", "")
            )
            
            # Get stats if available
            stats = team_stats.get(team_name, {
                "played": 0, "won": 0, "draw": 0, 
                "lost": 0, "gf": 0, "ga": 0
            })
            
            # Get badge
            badge = team.get("strTeamBadge", "")
            if not badge:
                badge = DataNormalizer.get_crest_url(team_name)
            
            standing = PremierLeagueStanding(
                position=idx,
                team_id=int(team.get("idTeam", 0) or 0),
                team_name=team_name,
                team_short_name=team.get("strTeamShort") or DataNormalizer.get_short_name(team_name),
                team_crest=badge,
                played_games=stats["played"],
                won=stats["won"],
                draw=stats["draw"],
                lost=stats["lost"],
                points=DataNormalizer.calculate_points(stats["won"], stats["draw"]),
                goals_for=stats["gf"],
                goals_against=stats["ga"],
                goal_difference=DataNormalizer.calculate_goal_difference(stats["gf"], stats["ga"]),
                form=None,
            )
            standings.append(standing)
        
        # Sort by points if we have match data
        if team_stats:
            standings.sort(key=lambda x: (x.points, x.goal_difference, x.goals_for), reverse=True)
            # Reassign positions
            for idx, standing in enumerate(standings, 1):
                standing.position = idx
        
        return standings
    
    @staticmethod
    def from_demo(standings: List[PremierLeagueStanding]) -> List[PremierLeagueStanding]:
        """Pass through demo data (already normalized)."""
        return standings


class MatchesNormalizer:
    """Normalize match data from various providers."""
    
    @staticmethod
    def from_football_data(matches: List[Dict[str, Any]]) -> List[PremierLeagueMatch]:
        """Normalize from football-data.org format."""
        normalized_matches = []
        
        for match in matches:
            home_team = match.get("homeTeam", {})
            away_team = match.get("awayTeam", {})
            score = match.get("score", {}).get("fullTime", {})
            
            home_name = DataNormalizer.normalize_team_name(home_team.get("name", ""))
            away_name = DataNormalizer.normalize_team_name(away_team.get("name", ""))
            
            match_obj = PremierLeagueMatch(
                match_id=match.get("id", 0),
                utc_date=DataNormalizer.normalize_date(match.get("utcDate", "")),
                status=DataNormalizer.normalize_status(match.get("status", "")),
                matchday=match.get("matchday", 0),
                home_team=home_name,
                home_team_short=home_team.get("shortName", DataNormalizer.get_short_name(home_name)),
                home_team_crest=home_team.get("crest", ""),
                away_team=away_name,
                away_team_short=away_team.get("shortName", DataNormalizer.get_short_name(away_name)),
                away_team_crest=away_team.get("crest", ""),
                home_score=score.get("home") or 0,
                away_score=score.get("away") or 0,
                is_manchester_united=(
                    DataNormalizer.is_manchester_united(home_name) or 
                    DataNormalizer.is_manchester_united(away_name)
                ),
            )
            normalized_matches.append(match_obj)
        
        return normalized_matches
    
    @staticmethod
    def from_thesportsdb(events: List[Dict[str, Any]]) -> List[PremierLeagueMatch]:
        """Normalize from TheSportsDB format."""
        normalized_matches = []
        
        for event in events:
            home_name = DataNormalizer.normalize_team_name(
                event.get("strHomeTeam", "")
            )
            away_name = DataNormalizer.normalize_team_name(
                event.get("strAwayTeam", "")
            )
            
            # Get scores
            home_score = 0
            away_score = 0
            
            int_home = event.get("intHomeScore")
            int_away = event.get("intAwayScore")
            
            if int_home is not None and int_away is not None:
                try:
                    home_score = int(int_home) if int_home else 0
                    away_score = int(int_away) if int_away else 0
                except (ValueError, TypeError):
                    home_score = 0
                    away_score = 0
            
            # Get date
            date_str = event.get("dateEventLocal", "")
            time_str = event.get("strTimeLocal", "15:00:00")
            
            if date_str:
                utc_date = f"{date_str}T{time_str}Z"
            else:
                utc_date = event.get("strDate", "")
                if utc_date:
                    utc_date = f"{utc_date}T{time_str}Z"
            
            # Determine status
            status_str = event.get("strStatus", "")
            if status_str in ["Finished", "FINISHED"]:
                status = "FINISHED"
            elif status_str in ["Not Started", "TIMED", "SCHEDULED"]:
                status = "SCHEDULED"
            else:
                status = DataNormalizer.normalize_status(status_str)
            
            match_obj = PremierLeagueMatch(
                match_id=int(event.get("idEvent", 0) or 0),
                utc_date=utc_date,
                status=status,
                matchday=int(event.get("intRound", 0) or 0),
                home_team=home_name,
                home_team_short=DataNormalizer.get_short_name(home_name),
                home_team_crest=event.get("strHomeTeamBadge", "") or DataNormalizer.get_crest_url(home_name),
                away_team=away_name,
                away_team_short=DataNormalizer.get_short_name(away_name),
                away_team_crest=event.get("strAwayTeamBadge", "") or DataNormalizer.get_crest_url(away_name),
                home_score=home_score,
                away_score=away_score,
                is_manchester_united=(
                    DataNormalizer.is_manchester_united(home_name) or 
                    DataNormalizer.is_manchester_united(away_name)
                ),
            )
            normalized_matches.append(match_obj)
        
        # Sort by date (newest first)
        normalized_matches.sort(key=lambda x: x.utc_date, reverse=True)
        
        return normalized_matches
    
    @staticmethod
    def from_demo(matches: List[PremierLeagueMatch]) -> List[PremierLeagueMatch]:
        """Pass through demo data (already normalized)."""
        return matches
    
    @staticmethod
    def filter_manchester_united(matches: List[PremierLeagueMatch]) -> List[PremierLeagueMatch]:
        """Filter to only Manchester United matches."""
        return [m for m in matches if m.is_manchester_united]
    
    @staticmethod
    def get_next_match(matches: List[PremierLeagueMatch]) -> Optional[PremierLeagueMatch]:
        """Get next scheduled match for Manchester United."""
        mu_matches = MatchesNormalizer.filter_manchester_united(matches)
        
        for match in mu_matches:
            if match.status == "SCHEDULED":
                return match
        
        return None
    
    @staticmethod
    def get_last_match(matches: List[PremierLeagueMatch]) -> Optional[PremierLeagueMatch]:
        """Get last finished match for Manchester United."""
        mu_matches = MatchesNormalizer.filter_manchester_united(matches)
        
        # Sort by date descending
        finished = [m for m in mu_matches if m.status == "FINISHED"]
        finished.sort(key=lambda x: x.utc_date, reverse=True)
        
        return finished[0] if finished else None
