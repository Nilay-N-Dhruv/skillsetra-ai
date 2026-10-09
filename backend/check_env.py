from app.core.config import settings as s

k = s.supabase_service_role_key
print("url                    :", s.supabase_url)
print("key starts with        :", k[:10] or "(EMPTY)")
print("key length             :", len(k))
print("has spaces             :", k != k.strip() or " " in k)
print("has quotes             :", '"' in k or "'" in k)
print("same as publishable key:", bool(k) and k == s.supabase_anon_key)
print("looks like a placeholder:", "PASTE" in k.upper())