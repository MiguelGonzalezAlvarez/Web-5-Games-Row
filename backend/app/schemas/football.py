from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


# Football API response schemas
class Team(BaseModel):
    id: int
    name: str
    shortName: str
    tla: str
    crest: str


class Score(BaseModel):
    fullTime: dict
    halfTime: dict


class Match(BaseModel):
    id: int
    competition: dict
    utcDate: str
    status: str
    matchday: int
    homeTeam: Team
    awayTeam: Team
    score: Score
    goals: List[dict] = []
    bookings: List[dict] = []


class StandingEntry(BaseModel):
    position: int
    team: Team
    playedGames: int
    won: int
    draw: int
    lost: int
    points: int
    goalsFor: int
    goalsAgainst: int
    goalDifference: int


class StandingTable(BaseModel):
    stage: str
    type: str
    table: List[StandingEntry]


class Competition(BaseModel):
    id: int
    name: str
    code: str
    emblem: str


class Season(BaseModel):
    id: int
    startDate: str
    endDate: str
    currentMatchday: int


# Custom response schemas
class PremierLeagueStanding(BaseModel):
    position: int
    team_id: int
    team_name: str
    team_short_name: str
    team_crest: str
    played_games: int
    won: int
    draw: int
    lost: int
    points: int
    goals_for: int
    goals_against: int
    goal_difference: int
    form: Optional[str] = None


class PremierLeagueMatch(BaseModel):
    match_id: int
    utc_date: str
    status: str
    matchday: int
    home_team: str
    home_team_short: str
    home_team_crest: str
    away_team: str
    away_team_short: str
    away_team_crest: str
    home_score: int
    away_score: int
    is_manchester_united: bool


class CurrentStreak(BaseModel):
    current_streak: int
    is_winning: bool
    streak_start_date: Optional[str] = None
    last_match_result: Optional[str] = None
    next_match: Optional[dict] = None
    # Extended fields for dashboard
    wins: int = 0
    draws: int = 0
    losses: int = 0
    recent_form: list[str] = []
    total_matches: int = 0
    longest_streak: int = 0


class ChallengeStatus(BaseModel):
    days_since_start: int
    current_streak: int
    target_streak: int = 5
    is_challenge_complete: bool
    next_match_date: Optional[str] = None
    next_match_home_team: Optional[str] = None
    next_match_away_team: Optional[str] = None
    motivational_message: str


class UserPredictionStats(BaseModel):
    total_predictions: int
    correct_predictions: int
    accuracy_percentage: float
    total_points: int
    rank: int
