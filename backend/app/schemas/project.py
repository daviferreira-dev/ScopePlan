from marshmallow import Schema, fields, validate


class ProjectCreateSchema(Schema):
    name = fields.String(required=True, validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True)
    version = fields.String(validate=validate.Length(max=20), load_default='1.0')
    status = fields.String(validate=validate.OneOf(['draft', 'active', 'completed', 'archived']),
                          load_default='draft')


class ProjectUpdateSchema(Schema):
    name = fields.String(validate=validate.Length(min=1, max=200))
    description = fields.String(allow_none=True)
    version = fields.String(validate=validate.Length(max=20))
    status = fields.String(validate=validate.OneOf(['draft', 'active', 'completed', 'archived']))


class ProjectSchema(Schema):
    id = fields.Integer(dump_only=True)
    name = fields.String()
    description = fields.String()
    owner_id = fields.Integer()
    owner = fields.Dict()
    version = fields.String()
    status = fields.String()
    requirements_count = fields.Integer()
    validated_count = fields.Integer()
    created_at = fields.DateTime()
    updated_at = fields.DateTime()
