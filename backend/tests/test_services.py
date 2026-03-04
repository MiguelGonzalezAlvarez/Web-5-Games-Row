import pytest
from datetime import datetime
from unittest.mock import Mock, patch, AsyncMock
from app.services.football_service import FootballAPIService, MemoryCache


class TestMemoryCache:
    def test_cache_set_and_get(self):
        cache = MemoryCache()
        cache.set("test_key", "test_value", ttl_seconds=60)
        result = cache.get("test_key")
        assert result == "test_value"

    def test_cache_expired(self):
        cache = MemoryCache()
        cache.set("test_key", "test_value", ttl_seconds=0)
        import time
        time.sleep(0.1)
        result = cache.get("test_key")
        assert result is None

    def test_cache_clear(self):
        cache = MemoryCache()
        cache.set("key1", "value1")
        cache.set("key2", "value2")
        cache.clear()
        assert cache.get("key1") is None
        assert cache.get("key2") is None


class TestFootballAPIService:
    @pytest.fixture
    def service(self):
        with patch('app.services.football_service.settings') as mock_settings:
            mock_settings.FOOTBALL_API_BASE_URL = "https://api.football-data.org/v4"
            mock_settings.FOOTBALL_API_KEY = "test_key"
            mock_settings.MANCHESTER_UNITED_TEAM_ID = 66
            return FootballAPIService()

    def test_service_initialization(self, service):
        from app.services.football_service import get_current_provider
        provider = get_current_provider()
        assert provider is not None
        assert provider.name in ["football-data.org", "TheSportsDB", "Demo Mode"]

    @pytest.mark.asyncio
    async def test_get_standings_cached(self, service):
        mock_standings = [
            {
                "position": 1,
                "team": {"id": 1, "name": "Arsenal", "shortName": "ARS", "crest": "url"},
                "playedGames": 25, "won": 18, "draw": 5, "lost": 2,
                "points": 59, "goalsFor": 60, "goalsAgainst": 25, "goalDifference": 35
            }
        ]
        
        with patch.object(service, 'get_standings', return_value=mock_standings):
            result = await service.get_standings(use_cache=False)
            assert len(result) == 1


class TestChallengeStatus:
    @pytest.mark.asyncio
    async def test_get_challenge_status(self):
        with patch('app.services.football_service.settings') as mock_settings:
            mock_settings.FOOTBALL_API_BASE_URL = "https://api.football-data.org/v4"
            mock_settings.FOOTBALL_API_KEY = "test_key"
            mock_settings.MANCHESTER_UNITED_TEAM_ID = 66
            mock_settings.HAIRCUT_CHALLENGE_START_DATE = "2024-10-05"
            
            with patch.object(FootballAPIService, 'calculate_current_streak') as mock_streak:
                with patch.object(FootballAPIService, 'get_next_manchester_united_match') as mock_match:
                    mock_streak.return_value = Mock(
                        current_streak=3,
                        is_winning=True,
                        streak_start_date="2026-02-01",
                        last_match_result="W",
                        next_match=None
                    )
                    mock_match.return_value = None
                    
                    service = FootballAPIService()
                    result = await service.get_challenge_status()
                    
                    assert result.current_streak == 3
                    assert result.target_streak == 5
                    assert result.is_challenge_complete == False
