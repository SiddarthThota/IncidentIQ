from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from app.core.logger import logger

security = HTTPBearer()

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Dependency to verify the Supabase JWT token from the frontend.
    This establishes the authentication boundary.
    Actual JWT verification logic will be implemented in Phase 1/2 when we need
    to identify the user making the request.
    """
    token = credentials.credentials
    if not token:
        logger.warning("Authentication failed: Missing token")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authentication token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # TODO: Implement Supabase JWT verification
    # For now, we return a mock user ID structure so the boundary exists
    # but the implementation isn't blindly trusting a raw string.
    
    return {"id": "pending-auth-implementation", "token": token}
