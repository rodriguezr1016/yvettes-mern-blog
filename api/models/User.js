const mongoose = require('mongoose');
const {Schema, model} = mongoose;

const UserSchema = new Schema({
    firstName: {type: String, required: true},
    lastName: {type: String, required: true},
    username: {type: String, required: true, min:4, unique: true},
    password: {type: String, required: true},
    email: {type: String, required: true, unique: true, match: [/.+\@.+\..+/, "Please enter a valid email"]}
});

const UserModel = model('User', UserSchema);

module.exports = UserModel;