from datetime import datetime
from app import db


class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text)
    owner_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    version = db.Column(db.String(20), default='1.0')
    status = db.Column(db.String(20), default='draft')  # draft, active, completed, archived
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    requirements = db.relationship('Requirement', backref='project', lazy='dynamic', cascade='all, delete-orphan')

    def to_dict(self, include_requirements=False):
        """Convert project to dictionary"""
        data = {
            'id': self.id,
            'name': self.name,
            'description': self.description,
            'owner_id': self.owner_id,
            'owner': self.owner.to_dict() if self.owner else None,
            'version': self.version,
            'status': self.status,
            'requirements_count': self.requirements.count(),
            'validated_count': self.requirements.filter_by(validated=True).count(),
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

        if include_requirements:
            data['requirements'] = [req.to_dict() for req in self.requirements.all()]

        return data

    def increment_version(self):
        """Increment project version"""
        parts = self.version.split('.')
        if len(parts) == 2:
            major, minor = parts
            self.version = f"{major}.{int(minor) + 1}"
        else:
            self.version = f"{self.version}.1"

    def __repr__(self):
        return f'<Project {self.name}>'
