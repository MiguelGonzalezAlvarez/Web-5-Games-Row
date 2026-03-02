import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from main import app


client = TestClient(app)


class TestHealthEndpoints:
    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert "version" in data

    def test_health_check(self):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"


class TestFootballEndpoints:
    @patch('app.services.football_service.football_service.get_standings')
    def test_get_standings(self, mock_standings):
        mock_standings.return_value = [
            {
                "position": 1,
                "team_id": 1,
                "team_name": "Arsenal",
                "team_short_name": "ARS",
                "team_crest": "https://example.com/crest.png",
                "played_games": 25,
                "won": 18,
                "draw": 5,
                "lost": 2,
                "points": 59,
                "goals_for": 60,
                "goals_against": 25,
                "goal_difference": 35,
                "form": "WWWDLW"
            }
        ]
        
        response = client.get("/api/v1/football/standings")
        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["team_name"] == "Arsenal"

    @patch('app.services.football_service.football_service.get_matches')
    def test_get_matches(self, mock_matches):
        mock_matches.return_value = []
        
        response = client.get("/api/v1/football/matches")
        assert response.status_code == 200

    @patch('app.services.football_service.football_service.get_challenge_status')
    def test_get_challenge_status(self, mock_status):
        mock_status.return_value = {
            "days_since_start": 500,
            "current_streak": 3,
            "target_streak": 5,
            "is_challenge_complete": False,
            "next_match_date": "2026-03-15T15:00:00Z",
            "next_match_home_team": "Manchester United",
            "next_match_away_team": "Aston Villa",
            "motivational_message": "Three wins! The end is near! ✂️"
        }
        
        response = client.get("/api/v1/football/challenge/status")
        assert response.status_code == 200
        data = response.json()
        assert data["days_since_start"] == 500
        assert data["current_streak"] == 3


class TestCommunityEndpoints:
    def test_get_posts_empty(self):
        response = client.get("/api/v1/community/posts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @patch('app.services.football_service.football_service.calculate_current_streak')
    def test_get_current_streak(self, mock_streak):
        mock_streak.return_value = {
            "current_streak": 4,
            "is_winning": True,
            "streak_start_date": "2026-02-10T00:00:00Z",
            "last_match_result": "W",
            "next_match": {
                "match_id": 123,
                "utc_date": "2026-03-15T15:00:00Z",
                "home_team": "Manchester United",
                "away_team": "Aston Villa"
            }
        }
        
        response = client.get("/api/v1/football/streak/current")
        assert response.status_code == 200


class TestErrorHandling:
    @patch('app.services.football_service.football_service.get_next_manchester_united_match')
    def test_next_match_not_found(self, mock_match):
        mock_match.return_value = None
        
        response = client.get("/api/v1/football/matches/next")
        assert response.status_code == 404
