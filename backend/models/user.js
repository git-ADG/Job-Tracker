const mongoose = require('mongoose');

//user schema
//email validation not implemented yet
//hashed passwords stored
//usernames not unique
const UserSchema = mongoose.Schema({
    username : {type: String, required: true},
    email : {type: String, required: true},
    password : {type: String, required: true}
}, {timestamps : true});

module.exports = mongoose.model('User', UserSchema);