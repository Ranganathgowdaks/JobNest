const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    name: { type: String, required: true },
    image: { type: String },
    skills: { type: String },
    cost: { type: Number },
    email: { type: String, required: true } // Add email field
});

module.exports = mongoose.model('Employee', employeeSchema);
