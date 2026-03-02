from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.models.models import User, Post, Comment, Like, Prediction
from app.schemas.schemas import (
    UserCreate,
    UserResponse,
    UserLogin,
    Token,
    PostCreate,
    PostResponse,
    PostWithComments,
    CommentCreate,
    CommentResponse,
    PredictionCreate,
    PredictionResponse,
)
from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()


def get_current_user_id(token: str) -> int:
    """Decode token and return user_id"""
    try:
        payload = decode_token(token)
        return payload.get("sub")
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Auth endpoints
@router.post("/auth/register", response_model=UserResponse)
async def register(user: UserCreate, db: Session = Depends(get_db)):
    """Register a new user"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )

    db_user = db.query(User).filter(User.username == user.username).first()
    if db_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username already taken",
        )

    hashed_password = get_password_hash(user.password)
    new_user = User(
        email=user.email,
        username=user.username,
        hashed_password=hashed_password,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user


@router.post("/auth/login", response_model=Token)
async def login(user: UserLogin, db: Session = Depends(get_db)):
    """Login user"""
    db_user = db.query(User).filter(User.email == user.email).first()
    if not db_user or not verify_password(user.password, db_user.hashed_password or ""):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    access_token = create_access_token(
        subject=db_user.id,
        expires_delta=timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES),
    )
    return {"access_token": access_token, "token_type": "bearer"}


# Posts endpoints
@router.get("/posts", response_model=list[PostResponse])
async def get_posts(
    skip: int = 0,
    limit: int = 20,
    db: Session = Depends(get_db),
):
    """Get community posts"""
    posts = db.query(Post).order_by(Post.created_at.desc()).offset(skip).limit(limit).all()
    return posts


@router.post("/posts", response_model=PostResponse)
async def create_post(
    post: PostCreate,
    db: Session = Depends(get_db),
    user_id: int = 1,  # Default user for demo
):
    """Create a new post"""
    new_post = Post(
        user_id=user_id,
        image_url=post.image_url,
        caption=post.caption,
    )
    db.add(new_post)
    db.commit()
    db.refresh(new_post)
    return new_post


@router.get("/posts/{post_id}", response_model=PostWithComments)
async def get_post(post_id: int, db: Session = Depends(get_db)):
    """Get a single post with comments"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )
    return post


@router.post("/posts/{post_id}/like")
async def like_post(
    post_id: int,
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    """Like a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    existing_like = db.query(Like).filter(
        Like.post_id == post_id,
        Like.user_id == user_id,
    ).first()

    if existing_like:
        db.delete(existing_like)
        post.likes_count = max(0, post.likes_count - 1)
    else:
        new_like = Like(post_id=post_id, user_id=user_id)
        db.add(new_like)
        post.likes_count += 1

    db.commit()
    return {"likes_count": post.likes_count}


# Comments endpoints
@router.post("/posts/{post_id}/comments", response_model=CommentResponse)
async def create_comment(
    post_id: int,
    comment: CommentCreate,
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    """Create a comment on a post"""
    post = db.query(Post).filter(Post.id == post_id).first()
    if not post:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Post not found",
        )

    new_comment = Comment(
        post_id=post_id,
        user_id=user_id,
        content=comment.content,
    )
    db.add(new_comment)
    db.commit()
    db.refresh(new_comment)
    return new_comment


# Predictions endpoints
@router.get("/predictions", response_model=list[PredictionResponse])
async def get_predictions(
    user_id: int | None = None,
    db: Session = Depends(get_db),
):
    """Get predictions"""
    query = db.query(Prediction)
    if user_id:
        query = query.filter(Prediction.user_id == user_id)
    return query.order_by(Prediction.created_at.desc()).all()


@router.post("/predictions", response_model=PredictionResponse)
async def create_prediction(
    prediction: PredictionCreate,
    db: Session = Depends(get_db),
    user_id: int = 1,
):
    """Create a prediction"""
    new_prediction = Prediction(
        user_id=user_id,
        match_id=prediction.match_id,
        home_team=prediction.home_team,
        away_team=prediction.away_team,
        prediction_home_goals=prediction.prediction_home_goals,
        prediction_away_goals=prediction.prediction_away_goals,
    )
    db.add(new_prediction)
    db.commit()
    db.refresh(new_prediction)
    return new_prediction
