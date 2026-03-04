"""
Unified demo data for the application.
This file centralizes all demo/placeholder data to avoid duplication.
"""
from app.schemas.football import PremierLeagueStanding, PremierLeagueMatch

DEMO_STANDINGS = [
    PremierLeagueStanding(
        position=1, team_id=57, team_name="Arsenal FC", 
        team_short_name="Arsenal", team_crest="https://crests.football-data.org/57.png",
        played_games=27, won=18, draw=6, lost=3, points=60, 
        goals_for=55, goals_against=25, goal_difference=30, form="WWWWD"
    ),
    PremierLeagueStanding(
        position=2, team_id=65, team_name="Manchester City FC", 
        team_short_name="Man City", team_crest="https://crests.football-data.org/65.png",
        played_games=27, won=17, draw=5, lost=5, points=56, 
        goals_for=58, goals_against=30, goal_difference=28, form="WWLWW"
    ),
    PremierLeagueStanding(
        position=3, team_id=66, team_name="Manchester United FC", 
        team_short_name="Man United", team_crest="https://crests.football-data.org/66.png",
        played_games=27, won=13, draw=8, lost=6, points=47, 
        goals_for=42, goals_against=32, goal_difference=10, form="WWDWW"
    ),
    PremierLeagueStanding(
        position=4, team_id=64, team_name="Liverpool FC", 
        team_short_name="Liverpool", team_crest="https://crests.football-data.org/64.png",
        played_games=27, won=16, draw=5, lost=6, points=53, 
        goals_for=52, goals_against=28, goal_difference=24, form="LWWWW"
    ),
    PremierLeagueStanding(
        position=5, team_id=61, team_name="Chelsea FC", 
        team_short_name="Chelsea", team_crest="https://crests.football-data.org/61.png",
        played_games=27, won=14, draw=6, lost=7, points=48, 
        goals_for=45, goals_against=30, goal_difference=15, form="WWLWW"
    ),
    PremierLeagueStanding(
        position=6, team_id=62, team_name="Tottenham Hotspur FC", 
        team_short_name="Spurs", team_crest="https://crests.football-data.org/47.png",
        played_games=27, won=13, draw=5, lost=9, points=44, 
        goals_for=48, goals_against=40, goal_difference=8, form="WLWWL"
    ),
    PremierLeagueStanding(
        position=7, team_id=58, team_name="Aston Villa FC", 
        team_short_name="Aston Villa", team_crest="https://crests.football-data.org/58.png",
        played_games=27, won=12, draw=6, lost=9, points=42, 
        goals_for=40, goals_against=35, goal_difference=5, form="DLLWW"
    ),
    PremierLeagueStanding(
        position=8, team_id=60, team_name="Newcastle United FC", 
        team_short_name="Newcastle", team_crest="https://crests.football-data.org/67.png",
        played_games=27, won=11, draw=7, lost=9, points=40, 
        goals_for=38, goals_against=38, goal_difference=0, form="WLDWL"
    ),
    PremierLeagueStanding(
        position=9, team_id=59, team_name="Brighton & Hove Albion FC", 
        team_short_name="Brighton", team_crest="https://crests.football-data.org/397.png",
        played_games=27, won=10, draw=8, lost=9, points=38, 
        goals_for=41, goals_against=40, goal_difference=1, form="WDWDL"
    ),
    PremierLeagueStanding(
        position=10, team_id=63, team_name="Fulham FC", 
        team_short_name="Fulham", team_crest="https://crests.football-data.org/63.png",
        played_games=27, won=10, draw=6, lost=11, points=36, 
        goals_for=35, goals_against=38, goal_difference=-3, form="LWWDL"
    ),
    PremierLeagueStanding(
        position=11, team_id=354, team_name="Crystal Palace FC", 
        team_short_name="Crystal Palace", team_crest="https://crests.football-data.org/52.png",
        played_games=27, won=9, draw=8, lost=10, points=35, 
        goals_for=30, goals_against=35, goal_difference=-5, form="WDWDL"
    ),
    PremierLeagueStanding(
        position=12, team_id=56, team_name="Brentford FC", 
        team_short_name="Brentford", team_crest="https://crests.football-data.org/402.png",
        played_games=27, won=9, draw=6, lost=12, points=33, 
        goals_for=38, goals_against=40, goal_difference=-2, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=13, team_id=351, team_name="West Ham United FC", 
        team_short_name="West Ham", team_crest="https://crests.football-data.org/56.png",
        played_games=27, won=9, draw=5, lost=13, points=32, 
        goals_for=31, goals_against=42, goal_difference=-11, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=14, team_id=340, team_name="Manchester City FC", 
        team_short_name="Man City", team_crest="https://crests.football-data.org/65.png",
        played_games=27, won=8, draw=7, lost=12, points=31, 
        goals_for=29, goals_against=34, goal_difference=-5, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=15, team_id=341, team_name="Wolverhampton Wanderers FC", 
        team_short_name="Wolves", team_crest="https://crests.football-data.org/39.png",
        played_games=27, won=8, draw=6, lost=13, points=30, 
        goals_for=27, goals_against=39, goal_difference=-12, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=16, team_id=349, team_name="Nottingham Forest FC", 
        team_short_name="Nott'm Forest", team_crest="https://crests.football-data.org/69.png",
        played_games=27, won=7, draw=8, lost=12, points=29, 
        goals_for=28, goals_against=36, goal_difference=-8, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=17, team_id=355, team_name="Crystal Palace FC", 
        team_short_name="Crystal Palace", team_crest="https://crests.football-data.org/52.png",
        played_games=27, won=7, draw=6, lost=14, points=27, 
        goals_for=26, goals_against=38, goal_difference=-12, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=18, team_id=341, team_name="Luton Town FC", 
        team_short_name="Luton", team_crest="https://crests.football-data.org/68.png",
        played_games=27, won=6, draw=5, lost=16, points=23, 
        goals_for=28, goals_against=50, goal_difference=-22, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=19, team_id=342, team_name="Burnley FC", 
        team_short_name="Burnley", team_crest="https://crests.football-data.org/44.png",
        played_games=27, won=5, draw=6, lost=16, points=21, 
        goals_for=25, goals_against=49, goal_difference=-24, form="LWDLW"
    ),
    PremierLeagueStanding(
        position=20, team_id=341, team_name="Sheffield United FC", 
        team_short_name="Sheffield Utd", team_crest="https://crests.football-data.org/49.png",
        played_games=27, won=3, draw=8, lost=16, points=17, 
        goals_for=22, goals_against=45, goal_difference=-23, form="LWDLW"
    ),
]


DEMO_MATCHES = [
    PremierLeagueMatch(
        match_id=999001, utc_date="2026-03-15T15:00:00Z", 
        status="SCHEDULED", matchday=28,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Arsenal FC", away_team_short="Arsenal", 
        away_team_crest="https://crests.football-data.org/57.png",
        home_score=0, away_score=0, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999002, utc_date="2026-03-08T15:00:00Z", 
        status="FINISHED", matchday=27,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Everton FC", away_team_short="Everton", 
        away_team_crest="https://crests.football-data.org/58.png",
        home_score=2, away_score=1, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999003, utc_date="2026-03-01T15:00:00Z", 
        status="FINISHED", matchday=26,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Tottenham Hotspur FC", away_team_short="Spurs", 
        away_team_crest="https://crests.football-data.org/47.png",
        home_score=3, away_score=2, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999004, utc_date="2026-02-22T15:00:00Z", 
        status="FINISHED", matchday=25,
        home_team="Fulham FC", home_team_short="Fulham", 
        home_team_crest="https://crests.football-data.org/63.png",
        away_team="Manchester United FC", away_team_short="Man United", 
        away_team_crest="https://crests.football-data.org/66.png",
        home_score=1, away_score=2, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999005, utc_date="2026-02-15T15:00:00Z", 
        status="FINISHED", matchday=24,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Wolverhampton Wanderers FC", away_team_short="Wolves", 
        away_team_crest="https://crests.football-data.org/39.png",
        home_score=1, away_score=0, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999006, utc_date="2026-02-08T17:30:00Z", 
        status="FINISHED", matchday=23,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="West Ham United FC", away_team_short="West Ham", 
        away_team_crest="https://crests.football-data.org/56.png",
        home_score=2, away_score=0, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999007, utc_date="2026-02-01T15:00:00Z", 
        status="FINISHED", matchday=22,
        home_team="Brighton & Hove Albion FC", home_team_short="Brighton", 
        home_team_crest="https://crests.football-data.org/397.png",
        away_team="Manchester United FC", away_team_short="Man United", 
        away_team_crest="https://crests.football-data.org/66.png",
        home_score=1, away_score=3, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999008, utc_date="2026-01-25T15:00:00Z", 
        status="FINISHED", matchday=21,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Southampton FC", away_team_short="Southampton", 
        away_team_crest="https://crests.football-data.org/38.png",
        home_score=4, away_score=0, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999009, utc_date="2026-01-18T15:00:00Z", 
        status="FINISHED", matchday=20,
        home_team="Liverpool FC", home_team_short="Liverpool", 
        home_team_crest="https://crests.football-data.org/64.png",
        away_team="Manchester United FC", away_team_short="Man United", 
        away_team_crest="https://crests.football-data.org/66.png",
        home_score=2, away_score=1, is_manchester_united=True
    ),
    PremierLeagueMatch(
        match_id=999010, utc_date="2026-01-11T15:00:00Z", 
        status="FINISHED", matchday=19,
        home_team="Manchester United FC", home_team_short="Man United", 
        home_team_crest="https://crests.football-data.org/66.png",
        away_team="Manchester City FC", away_team_short="Man City", 
        away_team_crest="https://crests.football-data.org/65.png",
        home_score=1, away_score=1, is_manchester_united=True
    ),
]


# Unified team name mappings for normalization
TEAM_NAME_MAPPING = {
    # Full names to standard
    "Manchester United FC": "Manchester United",
    "Manchester City FC": "Manchester City",
    "Tottenham Hotspur FC": "Tottenham",
    "Brighton & Hove Albion FC": "Brighton",
    "Wolverhampton Wanderers FC": "Wolves",
    "West Ham United FC": "West Ham",
    "Newcastle United FC": "Newcastle",
    "Nottingham Forest FC": "Nottingham Forest",
    "Crystal Palace FC": "Crystal Palace",
    "Aston Villa FC": "Aston Villa",
    "Brentford FC": "Brentford",
    "Sheffield United FC": "Sheffield United",
    "Luton Town FC": "Luton Town",
    "Burnley FC": "Burnley",
    "Arsenal FC": "Arsenal",
    "Chelsea FC": "Chelsea",
    "Liverpool FC": "Liverpool",
    "Everton FC": "Everton",
    "Fulham FC": "Fulham",
    "Southampton FC": "Southampton",
    "Bournemouth AFC": "Bournemouth",
    "Leeds United FC": "Leeds United",
    "Leicester City FC": "Leicester City",
    # Variations
    "Man United": "Manchester United",
    "Man City": "Manchester City",
    "Man Utd": "Manchester United",
    "MUFC": "Manchester United",
    "Spurs": "Tottenham",
    "Wolves": "Wolverhampton Wanderers",
    "Nott'm Forest": "Nottingham Forest",
    "Sheffield Utd": "Sheffield United",
}

# Short name mappings
SHORT_NAME_MAPPING = {
    "Manchester United": "Man United",
    "Manchester City": "Man City",
    "Tottenham Hotspur": "Spurs",
    "Brighton & Hove Albion": "Brighton",
    "Wolverhampton Wanderers": "Wolves",
    "West Ham United": "West Ham",
    "Newcastle United": "Newcastle",
    "Nottingham Forest": "Nott'm Forest",
    "Crystal Palace": "Crystal Palace",
    "Aston Villa": "Aston Villa",
    "Brentford": "Brentford",
    "Sheffield United": "Sheffield Utd",
    "Luton Town": "Luton",
    "Burnley": "Burnley",
    "Arsenal": "Arsenal",
    "Chelsea": "Chelsea",
    "Liverpool": "Liverpool",
    "Everton": "Everton",
    "Fulham": "Fulham",
    "Southampton": "Southampton",
    "Bournemouth": "Bournemouth",
    "Leeds United": "Leeds",
    "Leicester City": "Leicester",
    "West Brom": "West Brom",
    "Sunderland": "Sunderland",
}

# Current Premier League teams 2024/25
PREMIER_LEAGUE_TEAMS = [
    "Arsenal", "Aston Villa", "Bournemouth", "Brentford", "Brighton",
    "Burnley", "Chelsea", "Crystal Palace", "Everton", "Fulham",
    "Liverpool", "Manchester City", "Manchester United", "Newcastle",
    "Nottingham Forest", "Tottenham", "West Ham", "Wolves",
    "Luton Town", "Sheffield United"
]

# Manchester United identifiers
MANCHESTER_UNITED_NAMES = [
    "Manchester United",
    "Manchester United FC", 
    "Man United",
    "Man Utd",
    "MUFC",
    "manchester united",
]

# Fallback crest URLs by team name
FALLBACK_CRESTS = {
    "Manchester United": "https://crests.football-data.org/66.png",
    "Manchester City": "https://crests.football-data.org/65.png",
    "Liverpool": "https://crests.football-data.org/64.png",
    "Arsenal": "https://crests.football-data.org/57.png",
    "Chelsea": "https://crests.football-data.org/61.png",
    "Tottenham": "https://crests.football-data.org/47.png",
    "Newcastle": "https://crests.football-data.org/67.png",
}
