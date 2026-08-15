from backend.app.routers.auth import router as auth_router
from backend.app.routers.users import router as users_router
from backend.app.routers.master import router as master_router

__all__ = ["auth_router", "users_router", "master_router"]
