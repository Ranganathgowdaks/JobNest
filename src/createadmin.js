// createAdmin.js
const mongoose = require('mongoose');
const Admin = require('./adminModel');
const bcrypt = require('bcrypt');

mongoose.connect('mongodb://localhost:27017/jobnest', {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(async () => {
    console.log('Connected to MongoDB');
    const existingAdmin = await Admin.findOne({ username: 'admin123' });

    if (!existingAdmin) {
        const hashedPassword = await bcrypt.hash('password123', 10);
        const newAdmin = new Admin({
            username: 'admin123',
            password: hashedPassword,
            email: 'admin@example.com'
        });
        await newAdmin.save();
        console.log('Admin created successfully');
    } else {
        console.log('Admin already exists');
    }
})
.catch(err => console.error('Error:', err))
.finally(() => mongoose.connection.close());
