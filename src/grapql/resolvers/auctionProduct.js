const { AuctionProduct, User, AuctionType, ProductCategory } = require('../../dynamoose/schema')
const { AuthenticationError, withFilter, PubSub } = require('apollo-server-express')

const pubsub = new PubSub();

const AUCTION_ADDED = 'AUCTION_ADDED'
const LISTENER_ADD = 'LISTENER_ADD'



module.exports.query = {
	auctionProduct: async (parent, { ownerId, createTime }, context, info) => {
		return await AuctionProduct.get({ ownerId, createTime })
	},
	auctionProducts: async (parent, args, { ownerId }, info) => {
		if (ownerId) {
			return await AuctionProduct.query({ ownerId }).exec()
		} else {
			return await AuctionProduct.scan().exec()
		}

	},
	auctionProductsExist: async (parent, { categoryId }, info) => {
		if (categoryId) {
			
			return await AuctionProduct.scan('endTime').gt(new Date()).and().where('productCategory').eq(categoryId).exec()
		}
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
		User.get({ id: user.id }, (err, user) => {
			user.products = user.products || []
			if (!user.products.some(p => p.ownerId == product.ownerId && p.createTime.getTime() == product.createTime.getTime())) {
				user.products.push({ ownerId: product.ownerId, createTime: product.createTime })
				User.update({ id: user.id }, user)
			}
		})
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
		let originalUser = await User.get({ id: user.id })
		let amount = originalUser.amount || 0

		if (amount < 10000) {
			return {
				code: 422,
				success: false,
				message: 'Số dư trong tài khoản không đủ (từ 10,000VNĐ)'
			}
		} else {
			originalUser.amount = originalUser.amount - 10000
			await User.update({ id: user.id }, originalUser)
		}
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
		subscribe: withFilter(
			(parent, { product }, context, info) => {
				pubsub.publish(LISTENER_ADD, product)
				return pubsub.asyncIterator(AUCTION_ADDED)
			},
			(payload, { product }) => {
				let newUpdate = payload.auctionAdded;
				return newUpdate.ownerId == product.ownerId && newUpdate.createTime.getTime() == product.createTime.getTime();
			},
		),
	}
}

const listProductListener = new Map()

function setUpAuctionTimeOut(setProduct, product) {
	setProduct.add(product.createTime.getTime())
	console.log(product.endTime.getTime());

	let currentDate = new Date()
	setTimeout(async function (product) {
		let originalProduct = await AuctionProduct.get({ ownerId: product.ownerId, createTime: product.createTime })
		if (originalProduct.auctionHistory && originalProduct.auctionHistory.length > 0) {
			originalProduct.winner = originalProduct.auctionHistory[originalProduct.auctionHistory.length - 1].userName;
		}
		originalProduct.status = 2
		pubsub.publish(AUCTION_ADDED, { auctionAdded: originalProduct });
		AuctionProduct.update({ ownerId: product.ownerId, createTime: product.createTime }, originalProduct)
	}, product.endTime.getTime() - currentDate.getTime(), product)
}

function addProductListener(product) {
	if (listProductListener.has(product.ownerId)) {
		let setProduct = listProductListener.get(product.ownerId)
		if (!setProduct.has(product.createTime.getTime())) {
			setUpAuctionTimeOut(setProduct, product)
		}
	} else {
		let setProduct = new Set()
		listProductListener.set(product.ownerId, setProduct)
		setUpAuctionTimeOut(setProduct, product)
	}
}

pubsub.subscribe(LISTENER_ADD, product => {
	addProductListener(product)
})