import os
from dotenv import load_dotenv

project_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
env_path = os.path.join(project_root, ".env.supabase")
print(f"Loading env from: {env_path}, exists: {os.path.exists(env_path)}")
load_dotenv(env_path)
print(f"DB_URL: {os.getenv('DB_URL')}")
