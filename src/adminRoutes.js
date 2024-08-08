const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const Admin = require('./adminModel');
const Employee = require('./Employee');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images"));
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({ storage: storage });

// Middleware to parse JSON
router.use(express.json());

// Middleware to authenticate JWT token
const authenticateJWT = (req, res, next) => {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    
    if (token) {
        jwt.verify(token, 'your_jwt_secret', (err, user) => {
            if (err) return res.sendStatus(403);
            req.user = user;
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

// Route to render login page
router.get('/login', (req, res) => {
    res.render('adminlogin'); // Adjust path to your login view if needed
});

// Route to handle admin login
router.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const admin = await Admin.findOne({ username });

        if (!admin) {
            return res.status(401).send('Invalid username or password');
        }

        // Check password
        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
            return res.status(401).send('Invalid username or password');
        }

        // Generate JWT token
        const token = jwt.sign({ id: admin._id, username: admin.username }, 'your_jwt_secret', {
            expiresIn: '1h'
        });

        res.json({ token }); // Send token to client
    } catch (err) {
        console.error('Error logging in:', err);
        res.status(500).send('Server error');
    }
});

// Apply authentication middleware to protected routes
router.use(authenticateJWT);

// Protected routes
router.get('/addEmployee', async (req, res) => {
    try {
        const employees = await Employee.find();
        res.render('addEmployee', { employees });
    } catch (err) {
        console.error('Error fetching employees:', err);
        res.status(500).send('Error fetching employees');
    }
});

router.post('/addEmployee', upload.single('image'), async (req, res) => {
    try {
        const { name, skills, cost } = req.body;
        const image = req.file.filename;
        const employee = new Employee({ name, image, skills, cost });
        await employee.save();
        res.redirect('/addEmployee');
    } catch (err) {
        console.error('Error adding employee:', err);
        res.status(500).send('Error adding employee');
    }
});

router.get('/editEmployee/:id', async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).send('Employee not found');
        }
        res.render('editEmployee', { employee });
    } catch (err) {
        console.error('Error fetching employee:', err);
        res.status(500).send('Error fetching employee');
    }
});

router.post('/editEmployee/:id', async (req, res) => {
    try {
        const { name, skills, cost } = req.body;
        await Employee.findByIdAndUpdate(req.params.id, { name, skills, cost });
        res.redirect('/addEmployee');
    } catch (err) {
        console.error('Error editing employee:', err);
        res.status(500).send('Error editing employee');
    }
});

router.post('/deleteEmployee/:id', async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect('/addEmployee');
    } catch (err) {
        console.error('Error deleting employee:', err);
        res.status(500).send('Error deleting employee');
    }
});

module.exports = router;
