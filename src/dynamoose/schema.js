const dynamoose = require('./config')
// const AWS = require('aws-sdk')
// const dynamoose = require('dynamoose')

// AWS.config.setPromisesDependency()
// AWS.config.update({
// 	region: process.env.AWS_REGION,
// 	endpoint: process.env.DYNAMODB_URL
// })

// AWS.config.update({
// 	region:'local' ,
// 	endpoint: 'http://localhost:8000'
// })

// const dynamodb= new AWS.DynamoDB();

// dynamodb.scan({
// 	TableName: 'Role'
// },(err,result)=>{
// 	if(err)
// 		console.log('ok');
// 		else
// 		console.log(JSON.stringify(result,null,' '));


// })
//dynamoose.setDDB(dynamodb)




const Role = dynamoose.model('Role', {
	name: String,
	slug: {
		type: String,
		hashKey: true
	}
})

const ProductCategory = dynamoose.model('ProductCategory', {
	id: {
		type: String,
		hashKey: true
	},
	name: String
})

const AuctionType = dynamoose.model('AuctionType', {
	id: {
		type: String,
		hashKey: true
	},
	name: String,
	ruleDescription: String
})

const User = dynamoose.model('User', {
	id: {
		type: String,
		hashKey: true
	},
	userName: String,
	hashPassword: String,
	firstName: String,
	lastName: String,
	avatar: String,
	address: String,
	birthday: Date,
	phoneNumber: String,
	email: String,
	vipMember: Boolean,
	activeStatus: Boolean,
	createTime: Date,
	amount: Number,
	role: {
		type: String,
		required: true
	},
	products: {
		type: 'list',
		list: [{
			type: 'map',
			map: {
				ownerId: String,
				createTime: Date
			}
		}]
	}
})

const AuctionProduct = dynamoose.model('AuctionProduct', {
	ownerId: {
		type: String,
		hashKey: true
	},
	createTime: {
		type: Date,
		rangeKey: true
	},
	productName: String,
	startTime: Date,
	endTime: Date,
	avatar: String,
	images: {
		type: [String],
		default: []
	},
	currentPrice: Number,
	floorPrice: Number,
	priceStep: Number,
	ceilingPrice: Number,
	finalPrice: Number,
	winner: String,
	description: String,
	status: Number,
	productCategory: String,
	auctionHistory: {
		type: 'list',
		list: [{
			type: 'map',
			map: {
				time: Date,
				price: Number,
				userName: String,
				userId: String
			}
		}]
	},
	auctionCondition: {
		type: 'map',
		map: {
			vipAccount: Boolean,
			accountActiveDay: Number
		}
	},
	auctionType: String,
	owner: String
})

module.exports = {
	Role,
	ProductCategory,
	AuctionType,
	User,
	AuctionProduct
}