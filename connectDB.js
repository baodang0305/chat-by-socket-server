const mongoose = require("mongoose");

mongoose.Promise = Promise;

const option = {
	useNewUrlParser: true,
	useUnifiedTopology: true
}
mongoose.set('useFindAndModify', false);
CONNECT_STRING="mongodb+srv://baodang:baodang0305@cluster0-9tvmg.mongodb.net/webnc-looking-tutors"
const connectDB = async() => {
	try {
		await mongoose.connect(CONNECT_STRING, option, function(err) {
			if (err) {
				return console.log(err);
			}
			
			console.log("Connection DB is successed");
		})
	} catch (error) {
		return console.log(error);
	}
}

module.exports = connectDB;