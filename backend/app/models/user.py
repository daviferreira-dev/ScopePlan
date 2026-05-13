from datetime import datetime, timezone
import bcrypt
from app import db


class User(db.Model):
    __tablename__ = 'usuarios'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    nome = db.Column(db.String(120), nullable=False)
    email = db.Column(db.String(180), unique=True, nullable=False, index=True)
    senha_hash = db.Column(db.String(255), nullable=False)
    perfil = db.Column(db.String(20), nullable=False, default='analista')  # analista, desenvolvedor, cliente, gestor
    ativo = db.Column(db.Boolean, nullable=False, default=True)
    criado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc))
    atualizado_em = db.Column(db.DateTime, nullable=False, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))

    # Relationships
    projetos = db.relationship('Project', backref='gestor', lazy='dynamic', foreign_keys='Project.gestor_id')
    requisitos_criados = db.relationship('Requirement', backref='autor', lazy='dynamic',
        foreign_keys='Requirement.autor_id')
    validacoes = db.relationship('Validacao', backref='validador', lazy='dynamic',
        foreign_keys='Validacao.validador_id')

    def set_password(self, password):
        """Hash and set the user's password"""
        self.senha_hash = bcrypt.hashpw(
            password.encode('utf-8'),
            bcrypt.gensalt()
        ).decode('utf-8')

    def check_password(self, password):
        """Verify the password"""
        return bcrypt.checkpw(
            password.encode('utf-8'),
            self.senha_hash.encode('utf-8')
        )

    def to_dict(self):
        """Convert user to dictionary"""
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'perfil': self.perfil,
            'ativo': self.ativo,
            'criado_em': self.criado_em.isoformat() if self.criado_em else None,
            'atualizado_em': self.atualizado_em.isoformat() if self.atualizado_em else None
        }
