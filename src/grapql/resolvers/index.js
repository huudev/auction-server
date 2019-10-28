const Role = require('./role')
const User = require('./user')
const ProductCategory = require('./productCategory')
const AuctionType = require('./auctionType')
const AuctionProduct = require('./auctionProduct')
const Date = require('./date')

module.exports = {
	...Date,
	Query: {
		...Role, ...User.query, ...ProductCategory, ...AuctionType, ...AuctionProduct.query
	},
	Mutation: {
		...User.mutation, ...AuctionProduct.mutation
	},
	Subscription: {
		...AuctionProduct.subscription
	},
	MutationResponse: {
		__resolveType() {
			return null;
		}
	},
	AuctionProduct: AuctionProduct.auctionProduct
}