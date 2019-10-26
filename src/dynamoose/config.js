const AWS = require('aws-sdk')
const dynamoose = require('dynamoose')

AWS.config.setPromisesDependency()
AWS.config.update({
	region: process.env.AWS_REGION,
	endpoint: process.env.DYNAMODB_URL
})

dynamoose.setDDB(new AWS.DynamoDB())

module.exports = dynamoose
