from marshmallow import Schema, fields, validate, validates_schema, ValidationError, RAISE


STANDARD_TIPOS = ('funcional', 'nao_funcional', 'negocio', 'restricao')


def validate_tipo(value):
    """Aceita os tipos padrão ou chaves de blocos personalizados (custom_*)."""
    if value in STANDARD_TIPOS:
        return
    if value.startswith('custom_') and len(value) <= 30:
        return
    raise ValidationError('tipo deve ser um padrão ou um bloco personalizado (custom_*)')


class RequirementCreateSchema(Schema):
    titulo = fields.String(required=True, validate=validate.Length(min=1, max=300))
    descricao = fields.String(validate=validate.Length(max=50000))
    projeto_id = fields.Integer(required=True)
    codigo = fields.String(validate=validate.Length(max=20))
    tipo = fields.String(validate=validate_tipo, load_default='funcional')
    categoria = fields.String(validate=validate.Length(max=100))
    prioridade = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']),
                               load_default='media')


class RequirementUpdateSchema(Schema):
    class Meta:
        unknown = RAISE

    titulo = fields.String(validate=validate.Length(min=1, max=300))
    descricao = fields.String(validate=validate.Length(max=50000))
    codigo = fields.String(validate=validate.Length(max=20))
    tipo = fields.String(validate=validate_tipo)
    categoria = fields.String(validate=validate.Length(max=100))
    prioridade = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']))
    # status is NOT settable via PUT — use submit-review and validacoes endpoints


class ValidacaoCreateSchema(Schema):
    resultado = fields.String(required=True,
                              validate=validate.OneOf(['aprovado', 'aprovado_com_ressalvas', 'rejeitado']))
    comentario = fields.String(validate=validate.Length(max=50000))

    @validates_schema
    def validate_resultado_comentario(self, data, **kwargs):
        if data.get('resultado') == 'aprovado_com_ressalvas':
            comentario = data.get('comentario', '')
            if not comentario or not comentario.strip():
                raise ValidationError(
                    'Comentario e obrigatorio quando resultado e aprovado com ressalvas',
                    field_name='comentario'
                )
