from pathlib import Path

# Directory of SQL files
sql_dir = Path(__file__).parent

# Read all SQL files and expose their content as variables named after the files (without extension)
for sql_file in sql_dir.glob("*.sql"):
    var_name = sql_file.stem
    sql_text = sql_file.read_text(encoding="utf-8")
    globals()[var_name] = sql_text  # dynamic variable assignment for import

# Optional: list of all available SQL variables for introspection
__all__ = [f.stem for f in sql_dir.glob("*.sql")]
