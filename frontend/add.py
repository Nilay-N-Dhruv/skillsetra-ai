import pathlib

for d in ["app/login", "app/signup", "app/(app)/dashboard", "app/(app)/onboarding", "app/(app)/assessment",
          "app/(app)/competencies", "app/(app)/evidence", "app/(app)/roadmap", "app/(app)/career",
          "app/(app)/settings", "components", "lib", "hooks", "public"]:
    pathlib.Path(d).mkdir(parents=True, exist_ok=True)