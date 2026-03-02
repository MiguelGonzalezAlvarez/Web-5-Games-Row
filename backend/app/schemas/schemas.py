from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime
from typing import Optional


# User schemas
class UserBase(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)


class UserCreate(UserBase):
    password: str = Field(..., min_length=6)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserResponse(UserBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    avatar_url: Optional[str] = None
    is_active: bool
    created_at: datetime


class UserUpdate(BaseModel):
    username: Optional[str] = Field(None, min_length=3, max_length=50)
    avatar_url: Optional[str] = None


# Post schemas
class PostBase(BaseModel):
    image_url: str
    caption: Optional[str] = None


class PostCreate(PostBase):
    pass


class PostResponse(PostBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    likes_count: int
    created_at: datetime
    author: UserResponse


class PostWithComments(PostResponse):
    comments: list["CommentResponse"] = []


# Comment schemas
class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=500)


class CommentCreate(CommentBase):
    pass


class CommentResponse(CommentBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    post_id: int
    user_id: int
    created_at: datetime
    author: UserResponse


# Prediction schemas
class PredictionBase(BaseModel):
    match_id: str
    home_team: str
    away_team: str
    prediction_home_goals: int = Field(..., ge=0, le=20)
    prediction_away_goals: int = Field(..., ge=0, le=20)


class PredictionCreate(PredictionBase):
    pass


class PredictionResponse(PredictionBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    user_id: int
    actual_home_goals: Optional[int] = None
    actual_away_goals: Optional[int] = None
    points_earned: int
    is_correct: bool
    created_at: datetime


# Streak history schemas
class StreakHistoryResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: int
    streak_number: int
    start_date: datetime
    end_date: Optional[datetime] = None
    was_successful: bool


# Token schemas
class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    user_id: Optional[int] = None
