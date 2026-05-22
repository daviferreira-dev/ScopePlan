from marshmallow import Schema, fields, validate


class RequirementCreateSchema(Schema):
 titulo = fields.String(required=True, validate=validate.Length(min=1, max=300))
 descricao = fields.String(allow_none=True)
 projeto_id = fields.Integer(required=True)
 codigo = fields.String(validate=validate.Length(max=20), allow_none=True)
 tipo = fields.String(validate=validate.OneOf(['funcional', 'nao_funcional', 'negocio', 'restricao']),
 allow_none=True)
 categoria = fields.String(validate=validate.Length(max=100), allow_none=True)
 prioridade = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']),
 allow_none=True)
 status = fields.String(validate=validate.OneOf(['rascunho', 'em_revisao', 'aprovado', 'rejeitado', 'implementado']),
 load_default='rascunho')


class RequirementUpdateSchema(Schema):
 titulo = fields.String(validate=validate.Length(min=1, max=300))
 descricao = fields.String(allow_none=True)
 codigo = fields.String(validate=validate.Length(max=20), allow_none=True)
 tipo = fields.String(validate=validate.OneOf(['funcional', 'nao_funcional', 'negocio', 'restricao']),
 allow_none=True)
 categoria = fields.String(validate=validate.Length(max=100), allow_none=True)
 prioridade = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']),
 allow_none=True)
 status = fields.String(validate=validate.OneOf(['rascunho', 'em_revisao', 'aprovado', 'rejeitado', 'implementado']))


class ValidacaoCreateSchema(Schema):
 resultado = fields.String(required=True,
 validate=validate.OneOf(['aprovado', 'aprovado_com_ressalvas', 'rejeitado']))
 comentario = fields.String(allow_none=True)


class ValidacaoSchema(Schema):
 id = fields.Integer(dump_only=True)
 requisito_id = fields.Integer()
 validador_id = fields.Integer()
 resultado = fields.String()
 comentario = fields.String(allow_none=True)
 validado_em = fields.DateTime()


class RequirementSchema(Schema):
    """Dump schema for requirement responses."""
    id = fields.Integer(dump_only=True)
    projeto_id = fields.Integer()
    autor_id = fields.Integer()
    codigo = fields.String(allow_none=True)
    titulo = fields.String()
    descricao = fields.String(allow_none=True)
    tipo = fields.String(allow_none=True)
    categoria = fields.String(allow_none=True)
    prioridade = fields.String(allow_none=True)
    status = fields.String()
    numero_versao = fields.Integer()
    ativo = fields.Boolean()
    criado_em = fields.DateTime()
    atualizado_em = fields.DateTime()


class RequirementVersionSchema(Schema):
 id = fields.Integer(dump_only=True)
 requisito_id = fields.Integer()
 versao = fields.Integer()
 titulo = fields.String()
 descricao = fields.String(allow_none=True)
 codigo = fields.String(allow_none=True)
 tipo = fields.String(allow_none=True)
 categoria = fields.String(allow_none=True)
 prioridade = fields.String(allow_none=True)
 alterado_por_id = fields.Integer()
 alterado_em = fields.DateTime()
 resumo_alteracao = fields.String(allow_none=True)
