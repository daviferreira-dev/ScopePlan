from datetime import datetime
import bcrypt
from app import db


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    role = db.Column(db.String(20), nullable=False)  # 'analista' or 'cliente'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    projects = db.relationship('Project', backref='owner', lazy='dynamic', foreign_keys='Project.owner_id')
    requirements_created = db.relationship('Requirement', backref='author', lazy='dynamic',
                                         foreign_keys='Requirement.author_id')
    requirements_validated = db.relationship('Requirement', backref='validator', lazy='dynamic',
                                             foreign_keys='Requirement.validator_id')

    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        """Verify the password"""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.password_hash.encode('utf-8')
        )

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'role': self.role,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

    def __repr__(self):
        return f'<User {self.email}>'
