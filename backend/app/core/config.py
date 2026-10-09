"""All configuration comes from environment variables (see .env)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_env: str = "development"          # "production" hides /docs
    demo_mode: bool = True                # enables the sandboxed demo account
    allowed_origins: str = "http://localhost:3000"

    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""   # SERVER ONLY. Never send to the browser.

    # Puter is the default AI provider.
    # Ollama remains available as an alternative.
    ai_provider: str = "puter"
    ai_fallback: bool = True              # allow a LABELLED demo fallback when the AI is unreachable

    # Keep Ollama configuration so switching back is easy.
    ollama_base_url: str = "http://localhost:11434"
    ollama_model: str = "llama3.1:8b"

    github_token: str = ""

    rate_limit_per_minute: int = 90       # per IP, all endpoints
    ai_rate_limit_per_minute: int = 20    # Puter may need two requests per AI action


settings = Settings()