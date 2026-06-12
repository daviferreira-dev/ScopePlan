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
 # gestor_id removed from update schema — ownership transfer requires explicit
 # authorization check in route; not settable via generic setattr loop
