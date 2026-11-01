"""Customer support availability after installation, with per-unit coverage."""
from ..models import Project, Serial
from .warranty import warranty_state


def installation_finished(project):
    return project.stage in (Project.Stage.INSTALLED, Project.Stage.COMPLETED) or (
        project.kind == Project.Kind.PANELSET and project.stage == Project.Stage.DELIVERED)


def customer_support(project):
    if not installation_finished(project):
        return {'available': False}
    units = list(project.serials.filter(status=Serial.Status.DELIVERED).select_related('product'))
    covered = sum(warranty_state(unit).covered for unit in units)
    return {'available': bool(units), 'coveredUnits': covered, 'totalUnits': len(units),
            'warrantyLabel': ('Warranty active' if covered == len(units) else 'Warranty active on some units') if covered else 'No active warranty',
            'url': f'/portal/requests/new/?project={project.pk}'}
