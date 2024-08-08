const express = require('express');
const router = express.Router();
const Booking = require('./bookingModel'); // Import the Booking model
const Employee = require('./Employee'); // Import the Employee model
const transporter = require('./emailconfig'); // Import the email configuration

// Route to render the booking form (if needed)
router.get('/book-now', (req, res) => {
    const { employeeId } = req.query;
    res.render('bookNow', { employeeId }); // Pass employeeId to the form
});

// Route to handle form submission
router.post('/book-now', async (req, res) => {
    try {
        const { name, email, phone, address, jobdesc, date, employeeId } = req.body;

        const newBooking = new Booking({
            name,
            email,
            phone,
            address,
            jobdesc,
            date
        });

        await newBooking.save();

        // Fetch employee details
        const employee = await Employee.findById(employeeId);
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // Send email to the employee
        const mailOptions = {
            from: 'your-email@gmail.com', // Sender address
            to: employee.email,           // List of recipients
            subject: 'New Booking Request', // Subject line
            text: `You have a new booking request from ${name}. Details:\n\n
                   Email: ${email}\n
                   Phone: ${phone}\n
                   Address: ${address}\n
                   Job Description: ${jobdesc}\n
                   Date: ${date}\n`
        };

        await transporter.sendMail(mailOptions);

        res.status(200).json({ message: 'Booking request submitted successfully' });
    } catch (err) {
        console.error('Error submitting booking request:', err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
