"""
Phase 2 Migration Applicator
==============================
Applies the 20261008000000_init_documents.sql migration to Supabase
using the Supabase Management REST API (sql endpoint).

Requires: SUPABASE_URL, SUPABASE_SECRET_KEY in backend/.env
"""
import os
import sys
import json

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from dotenv import load_dotenv
load_dotenv(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".env"))

supabase_url = os.environ.get("SUPABASE_URL", "")
supabase_key = os.environ.get("SUPABASE_SECRET_KEY", "")

if not supabase_url or not supabase_key:
    print("FATAL: SUPABASE_URL or SUPABASE_SECRET_KEY not set")
    sys.exit(1)

# Read migration SQL
migration_path = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "supabase", "migrations", "20261008000000_init_documents.sql"
)

with open(migration_path, "r", encoding="utf-8") as f:
    migration_sql = f.read()

print(f"Migration SQL loaded ({len(migration_sql)} bytes)")
print("Statements to apply:")
for i, stmt in enumerate([s.strip() for s in migration_sql.split(';') if s.strip()]):
    print(f"  [{i+1}] {stmt[:80]}...")

# Try applying via Supabase rpc or direct approach
# Supabase Python client doesn't support raw DDL directly.
# We'll use httpx to call the Supabase SQL API endpoint
try:
    import httpx
    has_httpx = True
    print("\nhttpx available — will use Supabase SQL endpoint")
except ImportError:
    has_httpx = False
    print("\nhttpx not available")

try:
    import urllib.request
    has_urllib = True
except ImportError:
    has_urllib = False

# Extract project ref from URL
# URL format: https://<project-ref>.supabase.co
import re
match = re.search(r'https://([^.]+)\.supabase\.co', supabase_url)
if match:
    project_ref = match.group(1)
    print(f"Project ref: {project_ref[:8]}...")
else:
    print(f"WARN: Could not extract project ref from URL: {supabase_url[:30]}...")
    project_ref = None

def apply_sql_via_httpx(sql):
    """Apply SQL via Supabase Management API"""
    if not project_ref:
        return False, "No project ref"
    
    url = f"https://api.supabase.com/v1/projects/{project_ref}/database/query"
    headers = {
        "Authorization": f"Bearer {supabase_key}",
        "Content-Type": "application/json"
    }
    payload = json.dumps({"query": sql}).encode()
    
    req = urllib.request.Request(url, data=payload, headers=headers, method="POST")
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            body = resp.read().decode()
            return True, body
    except urllib.error.HTTPError as e:
        body = e.read().decode()
        return False, f"HTTP {e.code}: {body[:200]}"
    except Exception as e:
        return False, str(e)

# Apply migration statement by statement
print("\nApplying migration...")
statements = [s.strip() for s in migration_sql.split(';') if s.strip()]

all_ok = True
for i, stmt in enumerate(statements):
    success, detail = apply_sql_via_httpx(stmt)
    status = "OK" if success else "FAIL"
    print(f"  [{i+1}/{len(statements)}] {status} — {stmt[:60]}...")
    if not success:
        # Check if it's a "already exists" error (idempotent)
        if "already exists" in detail.lower() or "42p07" in detail.lower():
            print(f"           (already exists — safe to ignore)")
        else:
            print(f"           ERROR: {detail}")
            all_ok = False

print(f"\nMigration result: {'SUCCESS' if all_ok else 'PARTIAL/FAILED'}")
sys.exit(0 if all_ok else 1)
