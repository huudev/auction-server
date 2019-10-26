const { AuctionProduct } = require('../../dynamoose/schema')
const { AuthenticationError } = require('apollo-server-express')

module.exports.query = {
	auctionProduct: async (parent, { ownerId, createTime }, context, info) => {
		return await AuctionProduct.get({ ownerId, createTime }).exe()
	},
	auctionProducts: async (parent, args, context, info) => {
		return await AuctionProduct.scan().exec()
	},
	auctionProductsExist: async (parent, args, context, info) => {
		return await AuctionProduct.scan('createTime').gt(new Date()).exec()
	}
}

module.exports.mutation = {

	auction: async (parent, { ownerId, createTime, price }, { user }, info) => {
		if (!user)
			new AuthenticationError('must authenticate');
		let product = await AuctionProduct.get({ ownerId, createTime }).exe();
		product.auctionHistory = product.auctionHistory || []
		if (product.auctionHistory.length > 0) {
			if (product.auctionHistory[product.auctionHistory.length - 1].price > price)
				return {
					code: 422,
					success: false,
					message: 'Không được đấu giá thấp hơn'
				}
		}
		product.auctionHistory.push({ time: new Date(), user: user.id, price });
		AuctionProduct.update({ ownerId, createTime }, product);
		return {
			code: 201,
			success: true,
			message: ''
		}
	},
	addProduct: async (parent, { product }, { user }, info) => {
		if (!user)
			new AuthenticationError('must authenticate');
		product.status = 1
		let newProduct = new AuctionProduct(product)
		await newProduct.save()
		return {
			code: 201,
			success: true,
			message: ''
		}
	},
}

module.exports.auctionProduct = {
	owner: async (parent, args, context, info) => {
		if (!parent.ownerId) {
			return null
		} else {
			return await User.get(parent.ownerId)
		}
	}
}