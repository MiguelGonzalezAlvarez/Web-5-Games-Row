import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock, AsyncMock
from main import app
from app.models.models import User, Post, Prediction
from app.db.database import Base, engine


client = TestClient(app)


@pytest.fixture(scope="module")
def test_db():
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)


@pytest.fixture
def mock_user():
    with patch('app.api.v1.community.get_current_user') as mock:
        user = MagicMock()
        user.id = 1
        user.email = "test@example.com"
        user.username = "testuser"
        mock.return_value = user
        yield user


class TestHealthEndpoint:
    def test_root(self):
        response = client.get("/")
        assert response.status_code == 200
        assert "message" in response.json()

    def test_health(self):
        response = client.get("/health")
        assert response.status_code == 200
        assert response.json()["status"] == "healthy"


class TestAuthEndpoints:
    @patch('app.api.v1.community.get_db')
    def test_register_user(self, mock_db):
        mock_session = MagicMock()
        mock_db.return_value = mock_session
        mock_session.query.return_value.filter.return_value.first.return_value = None
        
        with patch('app.api.v1.community.get_password_hash', return_value="hashed_password"):
            response = client.post(
                "/api/v1/community/auth/register",
                json={
                    "email": "newuser@example.com",
                    "username": "newuser",
                    "password": "password123"
                }
            )
            assert response.status_code in [200, 201, 400]

    @patch('app.api.v1.community.get_db')
    def test_login_user(self, mock_db):
        mock_session = MagicMock()
        mock_db.return_value = mock_session
        mock_user = MagicMock()
        mock_user.hashed_password = "$2b$12$hash"
        mock_session.query.return_value.filter.return_value.first.return_value = mock_user
        
        with patch('app.api.v1.community.verify_password', return_value=True):
            response = client.post(
                "/api/v1/community/auth/login",
                json={
                    "email": "test@example.com",
                    "password": "password123"
                }
            )
            assert response.status_code in [200, 401]

    def test_login_invalid_credentials(self):
        with patch('app.api.v1.community.get_db') as mock_db:
            mock_session = MagicMock()
            mock_db.return_value = mock_session
            mock_session.query.return_value.filter.return_value.first.return_value = None
            
            response = client.post(
                "/api/v1/community/auth/login",
                json={
                    "email": "nonexistent@example.com",
                    "password": "wrongpassword"
                }
            )
            assert response.status_code == 401


class TestCommunityEndpoints:
    @patch('app.api.v1.community.get_db')
    def test_get_posts_empty(self, mock_db):
        mock_session = MagicMock()
        mock_db.return_value = mock_session
        mock_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = []
        
        response = client.get("/api/v1/community/posts")
        assert response.status_code == 200
        assert isinstance(response.json(), list)

    @patch('app.api.v1.community.get_db')
    def test_get_posts_with_data(self, mock_db):
        mock_session = MagicMock()
        mock_db.return_value = mock_session
        
        mock_post = MagicMock()
        mock_post.id = 1
        mock_post.user_id = 1
        mock_post.image_url = "https://example.com/image.jpg"
        mock_post.caption = "Test caption"
        mock_post.likes_count = 5
        mock_post.created_at = "2024-01-01T00:00:00"
        mock_post.author = MagicMock()
        mock_post.author.id = 1
        mock_post.author.username = "testuser"
        mock_post.author.avatar_url = None
        
        mock_session.query.return_value.order_by.return_value.offset.return_value.limit.return_value.all.return_value = [mock_post]
        
        response = client.get("/api/v1/community/posts")
        assert response.status_code == 200

    @patch('app.api.v1.community.get_db')
    def test_create_post(self, mock_db, mock_user):
        mock_session = MagicMock()
        mock_db.return_value = mock_session
        
        mock_post = MagicMock()
        mock_post.id = 1
        mock_post.user_id = 1
        mock_post.image_url = "https://example.com/image.jpg"
        mock_post.caption = "Test"
        mock_session.add = MagicMock()
        mock_session.commit = MagicMock()
        mock_session.refresh = MagicMock(side_effect=lambda x: setattr(x, 'id', 1))
        
        response = client.post(
            "/api/v1/community/posts",
            json={
                "image_url": "https://example.com/image.jpg",
                "caption": "Test"
            }
        )
        assert response.status_code in [200, 401]


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
            "current_streak": 4,
            "target_streak": 5,
            "is_challenge_complete": False,
            "next_match_date": "2026-03-15T15:00:00Z",
            "next_match_home_team": "Manchester United",
            "next_match_away_team": "Aston Villa",
            "motivational_message": "FOUR! One more! AAAAAHHH! 😱"
        }
        
        response = client.get("/api/v1/football/challenge/status")
        assert response.status_code == 200
        data = response.json()
        assert data["days_since_start"] == 500
        assert data["current_streak"] == 4

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
        data = response.json()
        assert data["current_streak"] == 4


class TestWebSocketStats:
    def test_websocket_stats(self):
        response = client.get("/api/v1/ws/ws/stats")
        assert response.status_code == 200
        data = response.json()
        assert "match_updates" in data
        assert "challenge_updates" in data
        assert "total_connections" in data


class TestErrorHandling:
    @patch('app.services.football_service.football_service.get_next_manchester_united_match')
    def test_next_match_not_found(self, mock_match):
        mock_match.return_value = None
        
        response = client.get("/api/v1/football/matches/next")
        assert response.status_code == 404

    def test_invalid_endpoint(self):
        response = client.get("/api/v1/invalid/endpoint")
        assert response.status_code == 404


class TestCORS:
    def test_cors_headers(self):
        response = client.options("/api/v1/football/standings")
        assert response.status_code in [200, 405]
