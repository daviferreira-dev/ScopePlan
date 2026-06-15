from app import db
from app.utils.time_utils import utc_iso
from datetime import datetime, timezone


class ProjetoVisaoGeral(db.Model):
    __tablename__ = 'projeto_visao_geral'

    id = db.Column(db.Integer, primary_key=True, autoincrement=True)
    projeto_id = db.Column(db.Integer, db.ForeignKey('projetos.id', ondelete='CASCADE'), nullable=False, unique=True, index=True)

    # 5W2H
    o_que   = db.Column(db.Text)   # What
    por_que = db.Column(db.Text)   # Why
    quem    = db.Column(db.Text)   # Who
    onde    = db.Column(db.Text)   # Where
    quando  = db.Column(db.Text)   # When
    como    = db.Column(db.Text)   # How
    quanto  = db.Column(db.Text)   # How much

    atualizado_em = db.Column(db.DateTime, nullable=False,
                              default=lambda: datetime.now(timezone.utc),
                              onupdate=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        return {
            'id': self.id,
            'projeto_id': self.projeto_id,
            'o_que':   self.o_que,
            'por_que': self.por_que,
            'quem':    self.quem,
            'onde':    self.onde,
            'quando':  self.quando,
            'como':    self.como,
            'quanto':  self.quanto,
            'atualizado_em': utc_iso(self.atualizado_em),
        }
