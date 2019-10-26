const { ProductCategory } = require('../../dynamoose/schema')


module.exports = {
	productCategories: async (parent, args, context, info) =>{
		return await ProductCategory.scan().exec()
	}
}