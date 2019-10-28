const multer = require('multer')
const storage = multer.diskStorage({
	destination: (req, file, callBack) => {
		callBack(null, 'uploads')
	},
	filename: (req, file, callBack) => {
		let originalname = file.originalname
		let extensionFile = originalname.substring(file.originalname.lastIndexOf('.'))
		callBack(null, new Date().getTime() + '_' + Math.floor(10 * Math.random()) + extensionFile)
	}
})

const upload = multer({ storage: storage })

module.exports = upload