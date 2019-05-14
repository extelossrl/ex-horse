const { gql, SchemaDirectiveVisitor } = require("apollo-server-micro")
const { defaultFieldResolver } = require("graphql")

class Acl extends SchemaDirectiveVisitor {
  visitObject(type) {
    this.ensureFieldsWrapped(type)

    type._aclAction = this.args.action
    type._aclSubject = this.args.subject
  }

  visitFieldDefinition(field, details) {
    this.ensureFieldsWrapped(details.objectType)

    field._aclAction = this.args.action
    field._aclSubject = this.args.subject
  }

  ensureFieldsWrapped(objectType) {
    // if (objectType._authFieldsWrapped) {
    //   return
    // }

    objectType._authFieldsWrapped = true
    const fields = objectType.getFields()

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = (...params) => {
        const [obj, args, context, info] = params

        const aclAction = field._aclAction || objectType._aclAction
        const aclSubject = field._aclSubject || objectType._aclSubject

        if (!aclAction || !aclSubject) {
          return resolve.apply(this, params)
        }

        const userRole = params[2].user.role

        context.acl[userRole].throwUnlessCan(aclAction, aclSubject)

        return resolve.apply(this, params)
      }
    })
  }
}

module.exports = ({ typeDefs, schemaDirectives, context, config }) => {
  typeDefs.push(gql`
    directive @Acl(action: String!, subject: String!) on FIELD_DEFINITION
  `)

  schemaDirectives.Acl = Acl

  context.push(async ({ req, res, connection }) => ({
    acl: config.acl
  }))
}
