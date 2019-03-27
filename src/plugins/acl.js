const { gql, SchemaDirectiveVisitor } = require("apollo-server")
const { defaultFieldResolver } = require("graphql")
const { AbilityBuilder } = require("@casl/ability")

const abilities = {
  ADMIN: AbilityBuilder.define((can) => {
    can("manage", "all")
  }),
  MEMBER: AbilityBuilder.define((can) => {
    can("read", "all")
  }),
  GUEST: AbilityBuilder.define((can) => {
    can("read", "all")
  })
}

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
    if (objectType._authFieldsWrapped) {
      return
    }

    objectType._authFieldsWrapped = true
    const fields = objectType.getFields()

    Object.keys(fields).forEach((fieldName) => {
      const field = fields[fieldName]
      const { resolve = defaultFieldResolver } = field

      field.resolve = (...args) => {
        const aclAction = field._aclAction || objectType._aclAction
        const aclSubject = field._aclSubject || objectType._aclSubject

        if (!aclAction || !aclSubject) {
          return resolve.apply(this, args)
        }

        const userRole = args[2].user.role

        abilities[userRole].throwUnlessCan(aclAction, aclSubject)

        return resolve.apply(this, args)
      }
    })
  }
}

module.exports = ({ typeDefs, schemaDirectives }) => {
  typeDefs.push(gql`
    directive @Acl(action: String!, subject: String!) on FIELD_DEFINITION
  `)

  schemaDirectives.Acl = Acl
}
