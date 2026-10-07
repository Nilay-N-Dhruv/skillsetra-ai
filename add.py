import pathlib

for d in ["backend/app/api", "backend/app/core", "backend/app/services", "backend/app/ai",
          "backend/tests", "database", "docs", "frontend"]:
    pathlib.Path(d).mkdir(parents=True, exist_ok=True)

for d in ["backend/app", "backend/app/api", "backend/app/core", "backend/app/services",
          "backend/app/ai", "backend/tests"]:
    pathlib.Path(d, "__init__.py").touch()      # marks a folder as a Python package
print("Folders ready")