const { Role } = require('../../dynamoose/schema')

module.exports = {
	roles:async (parent, args, context, info) => {
		return await Role.scan().exec()
		
		return [{slug:'USERA',name:'nguoi dang ban'}]
	}
}
