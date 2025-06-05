from pathlib import Path

# Read the .sql file and expose it as a string
init_schema_postgres = Path(__file__).parent / "init_schema_postgres.sql"
init_schema_postgres = init_schema_postgres.read_text(encoding="utf-8")