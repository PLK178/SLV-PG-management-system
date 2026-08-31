"""Read-only smoke tests for PostgreSQL using the `psql` client."""

import os
import shutil
import subprocess
import unittest


DATABASE_URL = os.getenv(
    "DATABASE_URL", "postgresql://app_user:pg_password@localhost:5432/pg_management"
)


def run_sql(query: str) -> str:
    """Run a SQL query through psql and return trimmed stdout."""
    if not shutil.which("psql"):
        raise unittest.SkipTest("psql is not available in this environment")

    result = subprocess.run(
        ["psql", "--no-psqlrc", "-v", "ON_ERROR_STOP=1", DATABASE_URL, "-tA", "-c", query],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise AssertionError(
            "psql query failed.\n"
            f"Query: {query.strip()}\n"
            f"Exit code: {result.returncode}\n"
            f"stderr: {result.stderr.strip() or '(empty)'}"
        )
    return result.stdout.strip()


class DatabaseSmokeTests(unittest.TestCase):
    def test_database_connection_is_alive(self):
        self.assertEqual(run_sql("SELECT 1"), "1")

    def test_expected_tables_exist(self):
        tables = set(
            filter(
                None,
                run_sql(
                    """
                    SELECT table_name
                    FROM information_schema.tables
                    WHERE table_schema = 'public'
                    ORDER BY table_name
                    """
                ).splitlines(),
            )
        )

        expected_tables = {
            "admins",
            "rooms",
            "tenants",
            "payments",
            "complaints",
            "outings",
        }

        self.assertTrue(expected_tables.issubset(tables))

    def test_seeded_admin_account_is_present(self):
        email = run_sql(
            "SELECT email FROM admins WHERE email = 'admin@gmail.com' LIMIT 1"
        )
        password = run_sql(
            "SELECT password FROM admins WHERE email = 'admin@gmail.com' LIMIT 1"
        )

        self.assertEqual(email, "admin@gmail.com")
        self.assertTrue(password.startswith(("$2a$", "$2b$")))

    def test_seed_data_exists_in_core_tables(self):
        checks = {
            "rooms": "SELECT COUNT(*) FROM rooms",
            "tenants": "SELECT COUNT(*) FROM tenants",
            "payments": "SELECT COUNT(*) FROM payments",
            "complaints": "SELECT COUNT(*) FROM complaints",
            "outings": "SELECT COUNT(*) FROM outings",
        }

        for table, query in checks.items():
            with self.subTest(table=table):
                self.assertGreater(int(run_sql(query)), 0)


if __name__ == "__main__":
    unittest.main()
