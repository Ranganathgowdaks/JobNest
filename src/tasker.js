const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Define the schema for tasker registration
const taskerSchema = new Schema({
    name: {
        type: String,
        required: true,
    },
    age: {
        type: Number,
        required: true,
        min: 18 // Assuming the minimum age for taskers is 18
    },
    phone: {
        type: String,
        required: true,
        unique: true, // Ensure phone numbers are unique
        match: [/^\d{10}$/, 'Please enter a valid 10-digit phone number'] // Regex for 10-digit phone number
    },
    email: {
        type: String,
        required: true,
        unique: true, // Ensure emails are unique
        match: [/\S+@\S+\.\S+/, 'Please enter a valid email address'] // Regex for email validation
    },
    works: {
        type: [String], // Array of strings to hold the types of work the tasker can do
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Create a model based on the schema
const Tasker = mongoose.model('Tasker', taskerSchema);

module.exports = Tasker;
