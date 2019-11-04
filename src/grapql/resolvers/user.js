const { User } = require('../../dynamoose/schema');
const uuid = require('uuid')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')

function signToken(user) {
	const token = jwt.sign(user, process.env.SECRET, {
		expiresIn: process.env.TOKEN_LIFE,
	});
	// Tạo một mã token khác - Refresh token
	const refreshToken = jwt.sign(user, process.env.REFRESH_TOKEN_SECRET, {
		expiresIn: process.env.REFRESH_TOKEN_LIFE
	});
	// Lưu lại mã Refresh token, kèm thông tin của user để sau này sử dụng lại
	//tokenList[refreshToken] = user;
	// Trả lại cho user thông tin mã token kèm theo mã Refresh token
	const response = {
		token,
		refreshToken,
	}
	return response;
}

module.exports.query = {
	login: async (parent, { userName, password }, context, info) => {
		let user = (await User.scan({ userName }).exec())[0]
		if (!user)
			return {}
		let same = await bcrypt.compare(password, user.hashPassword)
		if (!same) {
			return {}
		} else {
			return signToken({
				id: user.id,
				userName: user.userName,
				role: user.role,
				createTime: userName.createTime,
				vipMember: user.vipMember
			})
		}

	},
	user: async (parent, { id, userName }, context, info) => {
		if (userName) {
			let user = (await User.scan({ userName }).exec())[0]
			if (!user)
				return null
			else
				return user
		}
		return await User.get(id)
	},
	users: async (parent, args, context, info) => {
		return await User.scan().exec()
	},
	thongKe: async (parent, args, context, info) => {
		let rs = await User.scan('vipMember').eq(true).counts().exec()
		return { vip: rs.count, nonVip: rs.scannedCount - rs.count }
	},
}

module.exports.mutation = {
	addUser: async (parent, { user }, context, info) => {
		user.hashPassword = await bcrypt.hash(user.password, 10)
		user.id = uuid.v4()
		user.createTime = new Date()
		user.activeStatus = true
		let newUser = new User(user)
		try {
			await newUser.save()
			return {
				code: 201,
				success: true,
				message: '',
				user: newUser
			}
		} catch (ex) {
			return {
				code: 422,
				message: 'Unprocessable Entity',
				success: false
			}
		}

	},
	rechare: async (parent, { userId, change }, context, info) => {
		try {
			let userIndb = await User.get(userId);
			let newAmount = userIndb.amount ? userIndb.amount + change : change;
			await User.update({ id: userId }, { amount: newAmount })

			return {
				code: 202,
				message: '',
				success: true,
				newAmount: newAmount
			}
		} catch (ex) {

			return {
				code: 422,
				message: 'Unprocessable Entity',
				success: false
			}
		}
	},
	updateUser: async (parent, { user }, context, info) => {
		try {
			await User.update({ id: user.id }, user)

			return {
				code: 200,
				message: '',
				success: true,
				user
			}
		} catch (ex) {

			return {
				code: 422,
				message: 'Unprocessable Entity',
				success: false
			}
		}
	},
	lockUser: async (parent, { id }, context, info) => {
		try {
			await User.update({ id }, { activeStatus: false })
			return {
				code: 200,
				success: true,
				message: '',
				userId: id
			}
		} catch (ex) {
			return {
				code: 422,
				message: 'Unprocessable Entity',
				success: false
			}
		}

	},
}