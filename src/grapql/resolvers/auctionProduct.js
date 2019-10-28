const { AuctionProduct, User, AuctionType, ProductCategory } = require('../../dynamoose/schema')
const { AuthenticationError, withFilter, PubSub } = require('apollo-server-express')

const pubsub = new PubSub();

const AUCTION_ADDED = 'AUCTION_ADDED'

module.exports.query = {
	auctionProduct: async (parent, { ownerId, createTime }, context, info) => {
		return await AuctionProduct.get({ ownerId, createTime })
	},
	auctionProducts: async (parent, args, context, info) => {
		return await AuctionProduct.scan().exec()
	},
	auctionProductsExist: async (parent, args, context, info) => {
		return await AuctionProduct.scan('endTime').gt(new Date()).exec()
	}
}

module.exports.mutation = {

	auction: async (parent, { ownerId, createTime, price }, { user }, info) => {
		if (!user)
			new AuthenticationError('must authenticate');
		let product = await AuctionProduct.get({ ownerId, createTime });
		product.auctionHistory = product.auctionHistory || []
		if (product.auctionHistory.length > 0) {
			if (product.auctionHistory[product.auctionHistory.length - 1].price >= price)
				return {
					code: 422,
					success: false,
					message: 'Lượt đấu giá phải lớn hơn giá cao nhất hiện tại'
				}
		}
		product.auctionHistory.push({ time: new Date(), userName: user.userName, userId: user.id, price });
		await AuctionProduct.update({ ownerId, createTime }, product);
		pubsub.publish(AUCTION_ADDED, { auctionAdded: product });
		return {
			code: 201,
			success: true,
			message: 'Đấu giá giá thành công'
		}
	},
	addProduct: async (parent, { product }, { user }, info) => {
		if (!user)
			new AuthenticationError('must authenticate');
		product.ownerId = user.id
		product.status = 1
		product.createTime = new Date()
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
	productCategory: async (parent, args, context, info) => {
		if (!parent.productCategory) {
			return null
		} else {
			return await ProductCategory.get(parent.productCategory)
		}
	},
	auctionType: async (parent, args, context, info) => {
		if (!parent.auctionType) {
			return null
		} else {
			return await AuctionType.get(parent.auctionType)
		}
	},
	owner: async (parent, args, context, info) => {
		if (!parent.ownerId) {
			return null
		} else {
			return await User.get(parent.ownerId)
		}
	}
}

module.exports.subscription = {
	auctionAdded: {
		subscribe: () => pubsub.asyncIterator(AUCTION_ADDED),
		subscribe: withFilter(
			() => pubsub.asyncIterator(AUCTION_ADDED),
			(payload, { product }) => {
				let newUpdate = payload.auctionAdded;
				return newUpdate.ownerId == product.ownerId && newUpdate.createTime.getTime() == product.createTime.getTime();
			},
		),
	}
}
