import os
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from config.settings import settings
from api.lessons import router as lessons_router
from api.segments import router as segments_router
from utils.exceptions import AppException

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("dictation-backend")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure upload directories exist on startup
    logger.info("Initializing storage folders...")
    os.makedirs(settings.upload_dir, exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "audio"), exist_ok=True)
    os.makedirs(os.path.join(settings.upload_dir, "transcripts"), exist_ok=True)
    yield
    logger.info("Shutdown completed.")

app = FastAPI(
    title="Dictation Practice API",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware configuration
origins = [origin.strip() for origin in settings.allowed_hosts.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# App Exception Handler
@app.exception_handler(AppException)
async def app_exception_handler(request: Request, exc: AppException):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred. Please try again later."
            }
        }
    )

# Register routers
from api.stats import router as stats_router
from fastapi.staticfiles import StaticFiles

app.include_router(lessons_router, prefix="/api/v1")
app.include_router(segments_router, prefix="/api/v1")
app.include_router(stats_router, prefix="/api/v1")

# Expose uploaded audio and transcripts directories
app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok"}

