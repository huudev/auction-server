const { AuctionType } = require('../../dynamoose/schema')


module.exports = {
	auctionTypes: async (parent, args, context, info) =>{
		return await AuctionType.scan().exec()
	}
}