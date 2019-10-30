const AWS = require('aws-sdk')
const dynamoose = require('dynamoose')

AWS.config.setPromisesDependency()

if(process.env.NODE_ENV=='production'){
	AWS.config.update({
		region: process.env.AWS_REGION,
		sessionToken: process.env.SESSION_TOKEN,
		secretAccessKey: process.env.SECRET_ACCESS_KEY,
		accessKeyId: process.env.ACCESS_KEY_ID
	})
} else {
	AWS.config.update({
		region: 'local',
		endpoint: 'http://localhost:8000'
	})
}

dynamoose.setDDB(new AWS.DynamoDB())

module.exports = dynamoose
