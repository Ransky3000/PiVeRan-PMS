from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import bcrypt
from backend.app.database import get_db
from backend.app.models.user import UserAccount, AccountStatus
from backend.app.schemas.user import UserCreate, UserLogin, UserResponse

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False

@router.post("/signup", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(user_data: UserCreate, db: Session = Depends(get_db)):
    existing = db.query(UserAccount).filter(UserAccount.email == user_data.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email address is already registered.")

    new_user = UserAccount(
        email=user_data.email,
        password_hash=hash_password(user_data.password),
        name=user_data.name,
        phone_number=user_data.phone_number,
        role=user_data.role,
        status=AccountStatus.PENDING
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    return new_user

@router.post("/login", response_model=UserResponse)
def login_user(credentials: UserLogin, db: Session = Depends(get_db)):
    user = db.query(UserAccount).filter(UserAccount.email == credentials.email).first()
    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password.")
    
    return user
