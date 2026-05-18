from marshmallow import Schema, fields, validate


class ProjectCreateSchema(Schema):
    nome = fields.String(required=True, validate=validate.Length(min=1, max=200))
    descricao = fields.String(allow_none=True)
    status = fields.String(validate=validate.OneOf(['planejamento', 'em_andamento', 'em_revisao', 'concluido', 'cancelado']), load_default='planejamento')
    custo_estimado = fields.Decimal(places=2, allow_none=True)
    cliente_id = fields.Integer(allow_none=True)
    nome_cliente = fields.String(validate=validate.Length(max=200), allow_none=True)


class ProjectUpdateSchema(Schema):
    nome = fields.String(validate=validate.Length(min=1, max=200))
    descricao = fields.String(allow_none=True)
    status = fields.String(validate=validate.OneOf(['planejamento', 'em_andamento', 'em_revisao', 'concluido', 'cancelado']))
    custo_estimado = fields.Decimal(places=2, allow_none=True)
    cliente_id = fields.Integer(allow_none=True)
    nome_cliente = fields.String(validate=validate.Length(max=200), allow_none=True)


class ProjectSchema(Schema):
    id = fields.Integer(dump_only=True)
    nome = fields.String()
    descricao = fields.String()
    status = fields.String()
    custo_estimado = fields.Decimal()
    gestor_id = fields.Integer()
    gestor = fields.Dict()
    cliente_id = fields.Integer(allow_none=True)
    nome_cliente = fields.String(allow_none=True)
    ativo = fields.Boolean()
    requisitos_count = fields.Integer()
    aprovados_count = fields.Integer()
    criado_em = fields.DateTime()
    atualizado_em = fields.DateTime()
