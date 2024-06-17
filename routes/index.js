const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
let query = require('india-pincode-search');

// Define your User model here
const User = mongoose.model('User', new mongoose.Schema({
    name: String,
    gender: String,
    address: String,
    pincode: String,
    hometown: String,
    gotra: String,
    dob: String,
    phone: String,
    marital_status: String,
    photo: String,
    relationships: [
        {
            relation_type: String,
            related_user_id: mongoose.Schema.Types.ObjectId,
            related_user_name: String
        }
    ]
}));

// GET route for serving the HTML
router.get('/', (req, res) => {
    res.render('index');
});

// GET route for fetching users
router.get('/users', async (req, res) => {
    const users = await User.find({});
    res.json(users);
});

// GET route for fetching a user by name
router.get('/user/:name', async (req, res) => {
    const user = await User.findOne({ name: req.params.name });
    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
});

// GET route for fetching a user by id
router.get('/getUserById/:id', async (req, res) => {
    const user = await User.findOne({ _id: req.params.id });
    if (user) {
        res.json(user);
    } else {
        res.status(404).send('User not found');
    }
});

// POST route for adding a new user
router.post('/add', async (req, res) => {
    const user = new User(req.body);
    await user.save();
    res.send('User added successfully');
});

// POST route for adding a relationship
router.post('/add_relationship', async (req, res) => {
    const { user_id, relation_type, related_user_id } = req.body;
    const user = await User.findById(user_id);
    const relatedUser = await User.findById(related_user_id);

    if (user && relatedUser) {
        user.relationships.push({
            relation_type,
            related_user_id: relatedUser._id,
            related_user_name: relatedUser.name
        });

        // Add reciprocal relationship
        let reciprocalRelationType = '';
        if (relation_type === 'PARENT') {
            reciprocalRelationType = 'CHILD';
        } else if (relation_type === 'CHILD') {
            reciprocalRelationType = 'PARENT';
        } else if (relation_type === 'SPOUSE') {
            reciprocalRelationType = 'SPOUSE';
        }

        // Add reciprocal relationship to the related user
        if (reciprocalRelationType) {
            relatedUser.relationships.push({
                relation_type: reciprocalRelationType,
                related_user_id: user._id,
                related_user_name: user.name
            });
        }

        await user.save();
        await relatedUser.save();

        res.send('Relationship added successfully');
    } else {
        res.status(404).send('User or related user not found');
    }
});

async function getCityDetailsByPincode(pincode) {
    let cityDetails = await query.search(pincode);
    cityDetails = cityDetails[0];
    if (cityDetails) {
        return {
            office: cityDetails.office,
            city: cityDetails.city,
            district: cityDetails.district,
            state: cityDetails.state
        };
    }
    return null;
}

// GET route for fetching city based on pincode
router.get('/pincode/:pincode', async (req, res) => {
    const cityDetails = await getCityDetailsByPincode(req.params.pincode);
    if(cityDetails) {
        res.setHeader('Content-Type', 'text/plain');
        res.send(`${cityDetails.office}, ${cityDetails.city}, ${cityDetails.district}, ${cityDetails.state}`);
    } else {
        res.status(500).send("");
    }
});

module.exports = router;
