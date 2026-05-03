from fastapi import status
from sqlalchemy.orm import Session

from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User
from app.schemas.auth import Token
from app.schemas.user import UserCreate, UserLogin
from app.utils.exceptions import AppException


def register_user(payload: UserCreate, db: Session) -> User:
    existing_user = db.query(User).filter(User.email == payload.email).first()
    if existing_user:
        raise AppException(status.HTTP_409_CONFLICT, "Email is already registered")

    user = User(
        name=payload.name,
        email=payload.email,
        hashed_password=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


def authenticate_user(payload: UserLogin, db: Session) -> Token:
    user = db.query(User).filter(User.email == payload.email).first()
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise AppException(status.HTTP_401_UNAUTHORIZED, "Invalid email or password")

    return Token(access_token=create_access_token(user.email))
