from datetime import datetime
from app import db


class Requirement(db.Model):
    __tablename__ = 'requirements'

    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(300), nullable=False)
    description = db.Column(db.Text)
    project_id = db.Column(db.Integer, db.ForeignKey('projects.id'), nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    validator_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)

    # Requirement metadata
    type = db.Column(db.String(30))  # funcional, nao-funcional, negocio, usuario, sistema
    priority = db.Column(db.String(20))  # baixa, media, alta, critica
    complexity = db.Column(db.String(20))  # baixa, media, alta

    # Version control
    version = db.Column(db.String(20), default='1.0')
    version_history = db.Column(db.Text)  # JSON string with version history

    # Status and validation
    status = db.Column(db.String(30), default='draft')  # draft, in_review, approved, rejected
    validated = db.Column(db.Boolean, default=False)
    validated_at = db.Column(db.DateTime)
    validation_comments = db.Column(db.Text)

    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self, include_project=False):
        """Convert requirement to dictionary"""
        data = {
            'id': self.id,
            'title': self.title,
            'description': self.description,
            'project_id': self.project_id,
            'author_id': self.author_id,
            'author': self.author.to_dict() if self.author else None,
            'validator_id': self.validator_id,
            'validator': self.validator.to_dict() if self.validator else None,
            'type': self.type,
            'priority': self.priority,
            'complexity': self.complexity,
            'version': self.version,
            'version_history': self._parse_version_history(),
            'status': self.status,
            'validated': self.validated,
            'validated_at': self.validated_at.isoformat() if self.validated_at else None,
            'validation_comments': self.validation_comments,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_project and self.project:
            data['project'] = self.project.to_dict()

        return data

    def _parse_version_history(self):
        """Parse version history JSON"""
        if self.version_history:
            import json
            try:
                return json.loads(self.version_history)
            except:
                return []
        return []

    def add_version_history_entry(self, old_version, new_version, user_id, changes):
        """Add entry to version history"""
        import json
        history = self._parse_version_history()
        history.append({
            'from_version': old_version,
            'to_version': new_version,
            'user_id': user_id,
            'changes': changes,
            'timestamp': datetime.utcnow().isoformat()
        })
        self.version_history = json.dumps(history)

    def increment_version(self):
        """Increment requirement version"""
        parts = self.version.split('.')
        if len(parts) == 2:
            major, minor = parts
            self.version = f"{major}.{int(minor) + 1}"
        else:
            self.version = f"{self.version}.1"

    def validate_requirement(self, validator_id, comments=None):
        """Mark requirement as validated"""
        self.validated = True
        self.validator_id = validator_id
        self.validated_at = datetime.utcnow()
        self.validation_comments = comments
        self.status = 'approved'

    def reject_requirement(self, validator_id, comments=None):
        """Mark requirement as rejected"""
        self.validated = False
        self.validator_id = validator_id
        self.validated_at = datetime.utcnow()
        self.validation_comments = comments
        self.status = 'rejected'

    def __repr__(self):
        return f'<Requirement {self.title}>'
