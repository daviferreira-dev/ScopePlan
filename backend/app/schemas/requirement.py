from marshmallow import Schema, fields, validate


class RequirementCreateSchema(Schema):
    title = fields.String(required=True, validate=validate.Length(min=1, max=300))
    description = fields.String(allow_none=True)
    project_id = fields.Integer(required=True)
    type = fields.String(validate=validate.OneOf(['funcional', 'nao-funcional', 'negocio', 'usuario', 'sistema']),
                         allow_none=True)
    priority = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']),
                             allow_none=True)
    complexity = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta']), allow_none=True)
    status = fields.String(validate=validate.OneOf(['draft', 'in_review', 'approved', 'rejected']),
                           load_default='draft')


class RequirementUpdateSchema(Schema):
    title = fields.String(validate=validate.Length(min=1, max=300))
    description = fields.String(allow_none=True)
    type = fields.String(validate=validate.OneOf(['funcional', 'nao-funcional', 'negocio', 'usuario', 'sistema']),
                        allow_none=True)
    priority = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta', 'critica']), allow_none=True)
    complexity = fields.String(validate=validate.OneOf(['baixa', 'media', 'alta']), allow_none=True)
    status = fields.String(validate=validate.OneOf(['draft', 'in_review', 'approved', 'rejected']))


class RequirementValidationSchema(Schema):
    approved = fields.Boolean(required=True)
    comments = fields.String(allow_none=True)


class RequirementSchema(Schema):
    id = fields.Integer(dump_only=True)
    title = fields.String()
    description = fields.String()
    project_id = fields.Integer()
    author_id = fields.Integer()
    author = fields.Dict()
    validator_id = fields.Integer(allow_none=True)
    validator = fields.Dict(allow_none=True)
    type = fields.String()
    priority = fields.String()
    complexity = fields.String()
    version = fields.String()
    version_history = fields.List(fields.Dict())
    status = fields.String()
    validated = fields.Boolean()
    validated_at = fields.DateTime(allow_none=True)
    validation_comments = fields.String(allow_none=True)
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
