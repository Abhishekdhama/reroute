from datetime import date, datetime, timezone
import unittest

from models import Priority, Project, Task, TaskStatus
from risk_engine import assess_project


class RiskEngineTest(unittest.TestCase):
    def test_blocked_dependency_is_top_risk_with_action(self) -> None:
        project = Project(
            project_id="launch-demo",
            name="Launch",
            release_date=date(2026, 9, 20),
            tasks=[
                Task(
                    task_id="payments-api",
                    title="Payment API",
                    owner="Arjun",
                    status=TaskStatus.BLOCKED,
                    priority=Priority.CRITICAL,
                    due_date=date(2026, 9, 14),
                    progress=35,
                    last_updated_at=datetime(2026, 9, 11, tzinfo=timezone.utc),
                ),
                Task(
                    task_id="checkout-ui",
                    title="Checkout UI",
                    owner="Maya",
                    status=TaskStatus.TODO,
                    priority=Priority.HIGH,
                    due_date=date(2026, 9, 15),
                    progress=0,
                    dependencies=["payments-api"],
                    last_updated_at=datetime(2026, 9, 13, tzinfo=timezone.utc),
                ),
            ],
        )

        result = assess_project(project, date(2026, 9, 14), datetime(2026, 9, 14, tzinfo=timezone.utc))
        top_risk = result.at_risk_tasks[0]

        self.assertEqual("payments-api", top_risk.task_id)
        self.assertEqual(["checkout-ui"], top_risk.downstream_task_ids)
        self.assertIn("same-day unblock owner", top_risk.recommended_intervention)


if __name__ == "__main__":
    unittest.main()
