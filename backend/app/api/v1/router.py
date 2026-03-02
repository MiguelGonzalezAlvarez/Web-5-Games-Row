from fastapi import APIRouter
from app.api.v1 import football, community

api_router = APIRouter()

api_router.include_router(football.router, prefix="/football", tags=["Football"])
api_router.include_router(community.router, prefix="/community", tags=["Community"])
