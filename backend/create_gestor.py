#!/usr/bin/env python
"""CLI to create a gestor (admin) user.

Usage:
    python create_gestor.py <nome> <email> <senha>

Example:
    python create_gestor.py "Admin" "admin@scopeplan.com" "senha123"
"""
import sys
import os

# Ensure the backend directory is on the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import create_app, db
from app.models.user import User


def main():
    if len(sys.argv) != 4:
        print("Uso: python create_gestor.py <nome> <email> <senha>")
        print("Exemplo: python create_gestor.py \"Admin\" \"admin@scopeplan.com\" \"senha123\"")
        sys.exit(1)

    nome, email, senha = sys.argv[1], sys.argv[2], sys.argv[3]

    app = create_app()
    with app.app_context():
        existing = User.query.filter_by(email=email).first()
        if existing:
            if existing.perfil == 'gestor':
                print(f"Usuario gestor ja existe: {existing.email} (id={existing.id})")
            else:
                existing.perfil = 'gestor'
                db.session.commit()
                print(f"Usuario existente promovido a gestor: {existing.email} (id={existing.id})")
            return

        user = User(nome=nome, email=email, perfil='gestor', ativo=True)
        user.set_password(senha)
        db.session.add(user)
        db.session.commit()
        print(f"Gestor criado com sucesso: {user.email} (id={user.id})")


if __name__ == '__main__':
    main()
