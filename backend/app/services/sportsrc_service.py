import httpx
from datetime import datetime
from typing import Optional, List
from app.core.logging import logger


class SportSRCService:
    """Service for fetching real-time football data from SportSRC API"""
    
    BASE_URL = "https://api.sportsrc.org"
    
    async def get_premier_league_matches(self) -> List[dict]:
        """Get Premier League matches"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/",
                    params={"data": "matches", "category": "football"},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                pl_matches = []
                for match in data:
                    league = match.get("league", {}).get("name", "")
                    if "Premier League" in league or "PL" in league:
                        pl_matches.append(match)
                
                return pl_matches
        except Exception as e:
            logger.error(f"Error fetching PL matches from SportSRC: {e}")
            return []
    
    async def get_manchester_united_matches(self, limit: int = 10) -> List[dict]:
        """Get Manchester United matches"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/",
                    params={"data": "matches", "category": "football"},
                    timeout=30.0
                )
                response.raise_for_status()
                data = response.json()
                
                mu_matches = []
                for match in data:
                    home_team = match.get("home", {}).get("name", "")
                    away_team = match.get("away", {}).get("name", "")
                    
                    if "Manchester United" in home_team or "Manchester United" in away_team:
                        mu_matches.append(match)
                        
                    if len(mu_matches) >= limit:
                        break
                
                return mu_matches
        except Exception as e:
            logger.error(f"Error fetching MU matches from SportSRC: {e}")
            return []
    
    async def get_league_standings(self, league: str = "PL") -> List[dict]:
        """Get Premier League standings"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"{self.BASE_URL}/",
                    params={"data": "tables", "category": "leagues", "league": league},
                    timeout=30.0
                )
                response.raise_for_status()
                return response.json()
        except Exception as e:
            logger.error(f"Error fetching standings from SportSRC: {e}")
            return []


sportsrc_service = SportSRCService()
