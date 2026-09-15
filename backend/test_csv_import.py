import io
import unittest
from datetime import date, datetime, timezone

from csv_import import (
    CSVImportError,
    build_project_from_csv,
    import_tasks,
    load_seed_project,
)

TODAY = date(2026, 9, 15)
NOW = datetime(2026, 9, 15, 12, 0, tzinfo=timezone.utc)

ABSOLUTE_CSV = """task_id,title,owner,status,priority,due_date,progress,dependencies,latest_update,last_updated_at
payments-api,Payment API,Arjun,blocked,critical,2026-09-14,35,,Waiting on provider,2026-09-12T09:00:00+00:00
checkout-ui,Checkout UI,Maya,todo,high,2026-09-15,0,payments-api,Not started,2026-09-13T09:00:00+00:00
"""

RELATIVE_CSV = """task_id,title,owner,status,priority,due_in_days,progress,dependencies,latest_update,updated_hours_ago
payments-api,Payment API,Arjun,blocked,critical,-1,35,,Waiting on provider,72
checkout-ui,Checkout UI,Maya,todo,high,0,0,payments-api,Not started,24
"""


class CSVImportTest(unittest.TestCase):
    def test_absolute_dates_parse_cleanly(self) -> None:
        result = import_tasks(io.StringIO(ABSOLUTE_CSV), today=TODAY, now=NOW)
        self.assertTrue(result.ok)
        self.assertEqual(len(result.tasks), 2)
        checkout = next(t for t in result.tasks if t.task_id == "checkout-ui")
        self.assertEqual(checkout.dependencies, ["payments-api"])

    def test_relative_dates_resolve_against_today_and_now(self) -> None:
        result = import_tasks(io.StringIO(RELATIVE_CSV), today=TODAY, now=NOW)
        self.assertTrue(result.ok)
        payments = next(t for t in result.tasks if t.task_id == "payments-api")
        self.assertEqual(payments.due_date, date(2026, 9, 14))
        self.assertEqual(
            payments.last_updated_at, datetime(2026, 9, 12, 12, 0, tzinfo=timezone.utc)
        )

    def test_semicolon_and_comma_dependency_separators_both_work(self) -> None:
        csv_text = (
            "task_id,title,owner,status,priority,due_date,progress,dependencies,"
            "latest_update,last_updated_at\n"
            "rel,Release,Kenji,todo,critical,2026-09-20,0,\"a;b, c\",Plan drafted,"
            "2026-09-14T09:00:00+00:00\n"
        )
        result = import_tasks(io.StringIO(csv_text), today=TODAY, now=NOW)
        self.assertTrue(result.ok)
        self.assertEqual(result.tasks[0].dependencies, ["a", "b", "c"])

    def test_bad_row_is_collected_not_fatal(self) -> None:
        csv_text = (
            "task_id,title,owner,status,priority,due_date,progress,dependencies,"
            "latest_update,last_updated_at\n"
            "good,Good task,Maya,todo,high,2026-09-20,10,,ok,2026-09-14T09:00:00+00:00\n"
            "bad,Bad task,Maya,not_a_status,high,2026-09-20,10,,oops,2026-09-14T09:00:00+00:00\n"
        )
        result = import_tasks(io.StringIO(csv_text), today=TODAY, now=NOW)
        self.assertEqual(len(result.tasks), 1)
        self.assertEqual(len(result.errors), 1)
        self.assertEqual(result.errors[0].task_id, "bad")

    def test_duplicate_task_id_is_reported(self) -> None:
        csv_text = (
            "task_id,title,owner,status,priority,due_date,progress,dependencies,"
            "latest_update,last_updated_at\n"
            "dup,First,Maya,todo,high,2026-09-20,10,,ok,2026-09-14T09:00:00+00:00\n"
            "dup,Second,Maya,todo,high,2026-09-21,10,,ok,2026-09-14T09:00:00+00:00\n"
        )
        result = import_tasks(io.StringIO(csv_text), today=TODAY, now=NOW)
        self.assertEqual(len(result.tasks), 1)
        self.assertEqual(len(result.errors), 1)
        self.assertIn("duplicate", result.errors[0].message)

    def test_unknown_dependency_is_a_warning_not_an_error(self) -> None:
        csv_text = (
            "task_id,title,owner,status,priority,due_date,progress,dependencies,"
            "latest_update,last_updated_at\n"
            "a,A,Maya,todo,high,2026-09-20,10,ghost,ok,2026-09-14T09:00:00+00:00\n"
        )
        result = import_tasks(io.StringIO(csv_text), today=TODAY, now=NOW)
        self.assertTrue(result.ok)
        self.assertEqual(len(result.warnings), 1)

    def test_missing_required_column_raises(self) -> None:
        csv_text = "task_id,title,owner\nfoo,Foo,Maya\n"
        with self.assertRaises(CSVImportError):
            import_tasks(io.StringIO(csv_text))

    def test_build_project_from_csv_wraps_tasks(self) -> None:
        project, result = build_project_from_csv(
            _write_tmp(ABSOLUTE_CSV),
            project_id="p1",
            name="Project One",
            release_date=date(2026, 9, 30),
            today=TODAY,
            now=NOW,
        )
        self.assertTrue(result.ok)
        self.assertEqual(project.project_id, "p1")
        self.assertEqual(len(project.tasks), 2)

    def test_load_seed_project_is_self_consistent(self) -> None:
        project = load_seed_project(now=NOW)
        self.assertEqual(len(project.tasks), 14)
        ids = {t.task_id for t in project.tasks}
        self.assertIn("PAY-104", ids)
        # every dependency in the seed file should resolve within the seed file
        for task in project.tasks:
            for dep in task.dependencies:
                self.assertIn(dep, ids)


def _write_tmp(content: str) -> str:
    import tempfile

    fd = tempfile.NamedTemporaryFile(
        mode="w", suffix=".csv", delete=False, newline="", encoding="utf-8"
    )
    fd.write(content)
    fd.close()
    return fd.name


if __name__ == "__main__":
    unittest.main()
