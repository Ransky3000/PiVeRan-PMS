from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from backend.app.database import get_db
from backend.app.models.user import UserAccount, AccountStatus
from backend.app.schemas.user import UserResponse, UserStatusUpdate, UserAdminCreate, UserUpdate
from backend.app.routers.auth import hash_password

router = APIRouter(prefix="/api/users", tags=["User Management"])

@router.get("", response_model=List[UserResponse])
def get_users(status: Optional[AccountStatus] = None, db: Session = Depends(get_db)):
    query = db.query(UserAccount)
    if status:
        query = query.filter(UserAccount.status == status)
    return query.all()

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def create_user(user_data: UserAdminCreate, db: Session = Depends(get_db)):
    existing = db.query(UserAccount).filter(UserAccount.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email address is already registered.")
    new_user = UserAccount(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        phone_number=user_data.phone_number,
        role=user_data.role,
        status=user_data.status
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.put("/{user_id}", response_model=UserResponse)
def update_user(user_id: str, data: UserUpdate, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(user, key, value)
    
    db.commit()
    db.refresh(user)
    return user

@router.patch("/{user_id}/status", response_model=UserResponse)
def update_user_status(user_id: str, payload: UserStatusUpdate, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    
    user.status = payload.status
    db.commit()
    db.refresh(user)
    return user

@router.get("/{user_id}", response_model=UserResponse)
def get_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    return user

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_user(user_id: str, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.user_id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User account not found.")
    db.delete(user)
    db.commit()
    return None

