import logging

# Configure basic logging for the backend
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("incidentiq")

def log_safe(message: str, level: int = logging.INFO, **kwargs):
    """
    Log a message ensuring no sensitive keys (like passwords, keys, secrets) 
    are included in the kwargs.
    """
    safe_kwargs = {
        k: v for k, v in kwargs.items() 
        if "secret" not in k.lower() and "key" not in k.lower() and "password" not in k.lower()
    }
    if safe_kwargs:
        logger.log(level, f"{message} - Context: {safe_kwargs}")
    else:
        logger.log(level, message)
