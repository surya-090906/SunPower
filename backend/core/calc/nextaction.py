"""What is the next step on a project, who owns it, and has it been stuck too long? (blueprint section 5.6)"""
from .. import clock, config
from ..models import Project, Task

STAGE_NEXT = {
    "enquiry": ("Call the customer and verify the basics", "sales"),
    "qualified": ("Complete the site survey", "technician"),
    "survey": ("Review the survey", "engineer"),
    "quoting": ("Build and send the quote", "sales"),
    "quoted": ("Follow up on the quote", "sales"),
    "accepted": ("Collect the advance payment", "accounts"),
    "ordered": ("Pick and dispatch the equipment", "warehouse"),
    "dispatched": ("Confirm delivery on site", "technician"),
    "delivered": ("Install the system", "technician"),
    "installed": ("Collect the balance and finish the subsidy paperwork", "accounts"),
}


def next_action(project):
    """Earliest open task, else the stage's implicit next step. None when the project is finished or lost."""
    task = project.tasks.filter(status=Task.Status.OPEN).order_by("due_at", "seq").first()
    if task:
        return {"title": task.title, "role": task.owner_role, "due": task.due_at, "overdue": bool(task.overdue), "kind": task.kind}
    default = STAGE_NEXT.get(project.stage)
    if default:
        return {"title": default[0], "role": default[1], "due": None, "overdue": False, "kind": "stage"}
    return None


def stuck_info(project):
    """{'days': n, 'stuck': bool, 'overdue': bool}. DISCOM/subsidy steps get a longer threshold."""
    if project.stage in (Project.Stage.COMPLETED, Project.Stage.LOST):
        return {"days": 0, "stuck": False, "overdue": False}
    na = next_action(project)
    days = (clock.now() - project.stage_since).days
    limit = config.get("stuck_days_discom") if na and na["kind"] == "subsidy" else config.get("stuck_days")
    overdue = bool(na and na["overdue"])
    return {"days": days, "stuck": days >= limit or overdue, "overdue": overdue}
