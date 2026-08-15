from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import UserAccount, AccountStatus
from backend.app.schemas.user import UserResponse, UserStatusUpdate

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(status: Optional[AccountStatus] = None, db: Session = Depends(get_db)):
    query = db.query(UserAccount)
    if status:
        query = query.filter(UserAccount.status == status)
    return query.all()

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: str, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    
    user.status = payload.status
    db.commit()
    db.refresh(user)
    return user
