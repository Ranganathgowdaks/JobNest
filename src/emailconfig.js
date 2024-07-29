const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'Gmail', // You can use different services like 'Outlook', 'Yahoo', etc.
    auth: {
        user: 'your-email@gmail.com', // Your email address
        pass: 'your-email-password'    // Your email password or app-specific password
    }
});

module.exports = transporter;
