import os
from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    database_url: str = "sqlite:///./dictation.db"
    upload_dir: str = "./uploads"
    allowed_hosts: str = "*"

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = Settings()

# Automatically ensure directories exist when settings are loaded
if settings.database_url.startswith("sqlite:///"):
    # Extract path from sqlite:///path/to/db
    db_path = settings.database_url.replace("sqlite:///", "")
    db_dir = os.path.dirname(db_path)
    if db_dir:
        os.makedirs(db_dir, exist_ok=True)

