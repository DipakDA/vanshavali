const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    name: String,
    gender: String,
    address: String,
    pincode: String,
    gotra: String,
    dob: String,
    phone: String,
    marital_status: String,
    hometown: String,
    photo: String,
    relationships: [{
        relation_type: String,
        related_user_id: mongoose.Schema.Types.ObjectId
    }]
});

const User = mongoose.model('User', userSchema);

module.exports = User;