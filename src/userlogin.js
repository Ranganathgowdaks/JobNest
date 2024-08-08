const mongoose = require('mongoose');

// Define the schema
const signupSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        match: [ /^\S+@\S+\.\S+$/, 'Please use a valid email address.' ] // Email validation
    },
    phone: {
        type: Number,
        required: true
        // Additional validation for phone number can be added here if needed
    },
    password: {
        type: String,
        required: true
        // Password hashing and validation are handled in application logic (not in schema)
    }
});

// Create the model
const Signup = mongoose.model('Signup', signupSchema);

module.exports = Signup;
