const express = require("express");
const hbs = require("hbs");
const mongoose = require("mongoose");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const cors = require("cors");
const nodemailer = require("nodemailer");
const Employee = require("./Employee"); // Path to Employee model
const signup=require("./userlogin");
const Tasker = require("./tasker"); // Path to Tasker model
const services = require("./services");
const productdata=require("../views/services.json")
const bcrypt = require('bcrypt');
const flash = require('connect-flash');
const session = require('express-session');
const adminRoutes = require('./adminRoutes');
const bookNowRoutes = require('./bookingRoutes'); // Import the booking routes

const app = express();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../public/images")); // Destination folder for uploaded images
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname); // File naming: timestamp-originalname
    }
});

const upload = multer({ storage: storage });

// CORS middleware
app.use(cors());

// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Serve static files from public directory
app.use(express.static(path.join(__dirname, "../public")));
app.use(express.static(path.join(__dirname, "../views")));

// Set view engine to Handlebars
app.set("view engine", "hbs");

// Set views directory
app.set("views", path.join(__dirname, "../views"));

// Register partials directory
hbs.registerPartials(path.join(__dirname, "../views/partials"));

// Create a transporter object for sending emails
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'your-email@gmail.com',
        pass: 'your-email-password' // Use an app-specific password if 2FA is enabled
    }
});

// Express session middleware
app.use(session({
    secret: 'secret',
    resave: true,
    saveUninitialized: true
}));

// Connect flash middleware
app.use(flash());
app.use((req, res, next) => {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error = req.flash('error');
    next();
});

// Function to send email notifications
const sendEmailNotification = (to, subject, text) => {
    const mailOptions = {
        from: 'your-email@gmail.com',
        to: to,
        subject: subject,
        text: text
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};

// Define routes
app.get("/", (req, res) => {
    res.render("home");
});
app.get("/services", (req, res) => {
    res.render('services');
});
app.get('/section', (req, res) => {
    res.render("section");
});
app.get('/home', (req, res) => {
    res.render('home');
});
app.get("/adminlogin", (req, res) => {
    res.render("adminlogin");
});
app.get('/bookNow',(req, res) => {
    res.render('bookNow');
})
// Use the booking routes
app.use('/', bookNowRoutes); // Adjust the path as needed
///////////////////////////////////////////////////////////////////////////////signup and login

app.get("/usersignup", (req, res) => {
    res.render("usersignup");
});

app.post("/usersignup", async (req, res) => {
    const { name, email, phone, password } = req.body;

    try {
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10); // 10 is the salt rounds

        // Create a new user document in MongoDB
        const newUser = new signup({ name, email, phone, password: hashedPassword });
        await newUser.save(); // Save the new user data

        // Set flash message and redirect to login page
        req.flash('success_msg', 'Signup successful! Please login.');
        res.redirect("userlogin"); // Redirect to the login page
    } catch (err) {
        console.error("Error signing up:", err);
        req.flash('error_msg', 'Error signing up. Please try again.');
        res.redirect("/usersignup"); // Redirect back to signup page on error
    }
});

// Login
app.get("/userlogin", (req, res) => {
    res.render("userlogin");
});
app.post("/userlogin", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await signup.findOne({ email });

        if (!user) {
            req.flash('error_msg', 'No user with that email found.');
            return res.redirect("/userlogin");
        }

        const passwordMatch = await bcrypt.compare(password, user.password);

        if (passwordMatch) {
            req.flash('success_msg', 'Login successful!');
            return res.render("home", { name: user.name });
        } else {
            req.flash('error_msg', 'Invalid password.');
            return res.redirect("/userlogin");
        }
    } catch (err) {
        console.error("An error occurred during login:", err);
        req.flash('error_msg', 'An error occurred. Please try again later.');
        return res.redirect("/userlogin");
    }
});









////////////////////////////////////////////////////////////////////////////////////////////

// Route to render form for adding employee
app.get("/addEmployee", async (req, res) => {
    try {
        const employees = await Employee.find();
        res.render("addEmployee", { employees });
    } catch (err) {
        console.error("Error fetching employees:", err);
        res.status(500).send("Error fetching employees");
    }
});

// Route to handle form submission for adding employee
app.post("/addEmployee", upload.single("image"), async (req, res) => {
    try {
        const { name, skills, cost, email } = req.body;
        const image = req.file ? req.file.filename : null;
        const employee = new Employee({ name, image, skills, cost, email });
        await employee.save();

        // Send an email notification to the employee
        sendEmailNotification(
            email,
            'Welcome!',
            `Hello ${name}, you have been added as an employee with the following details:
            Skills: ${skills}
            Cost: ${cost}`
        );

        res.redirect("/addEmployee");
    } catch (err) {
        console.error("Error adding employee:", err);
        res.status(500).send("Error adding employee");
    }
});

// Route to render form for editing employee
app.get("/editEmployee/:id", async (req, res) => {
    try {
        const employee = await Employee.findById(req.params.id);
        if (!employee) {
            return res.status(404).send("Employee not found");
        }
        res.render("editEmployee", { employee });
    } catch (err) {
        console.error("Error fetching employee:", err);
        res.status(500).send("Error fetching employee");
    }
});

// Route to handle form submission for editing employee
app.post("/editEmployee/:id", async (req, res) => {
    try {
        const { name, skills, cost } = req.body;
        await Employee.findByIdAndUpdate(req.params.id, { name, skills, cost });
        res.redirect("/addEmployee");
    } catch (err) {
        console.error("Error editing employee:", err);
        res.status(500).send("Error editing employee");
    }
});

// Route to handle deleting an employee
app.post("/deleteEmployee/:id", async (req, res) => {
    try {
        await Employee.findByIdAndDelete(req.params.id);
        res.redirect("/addEmployee");
    } catch (err) {
        console.error("Error deleting employee:", err);
        res.status(500).send("Error deleting employee");
    }
});

// Route to render hire page with only added employees
app.get("/hire", async (req, res) => {
    try {
        const employees = await Employee.find();
        res.render("hire", { employees });
    } catch (err) {
        console.error("Error fetching employees:", err);
        res.status(500).send("Error fetching employees");
    }
});

// Register a custom helper to create a range of numbers
hbs.registerHelper('range', function (n) {
    return Array.from({ length: n }, (v, k) => k + 1);
});

// Route to render form for tasker registration
app.get("/registerTasker", (req, res) => {
    res.render("registerTasker");
});
app.get("/taskersuccess", (req, res) => {
    res.render('taskersuccess');
});

// Route to handle form submission for tasker registration
app.post("/registerTasker", async (req, res) => {
    try {
        const { name, age, phone, email, works } = req.body;
        const tasker = new Tasker({ name, age, phone, email, works: works.split(',').map(work => work.trim()) });
        await tasker.save();
        res.redirect("/taskersuccess");
    } catch (err) {
        console.error("Error registering tasker:", err);
        res.status(500).send("Error registering tasker");
    }
});

// Route to render list of registered taskers
app.get("/taskers", async (req, res) => {
    try {
        const taskers = await Tasker.find();
        res.render("taskers", { taskers });
    } catch (err) {
        console.error("Error fetching taskers:", err);
        res.status(500).send("Error fetching taskers");
    }
});
///////////////////////////////////////////////////////////////////////////////////////search
/////search

app.get("/displayservices", async (req, res) => {
    try {
        const searchTerm = req.query.search?.toLowerCase();
        if (!searchTerm) {
            return res.render("home"); // Render home page if no search term
        }

        // Assuming `products` is your Mongoose model for products
        const result = await services.findOne({
            name: { $regex: searchTerm, $options: "i" }, // Case-insensitive search
        });

        if (result) {
            return res.render("displayservices", { product: result }); // Render product details if found
        } else {
            return res.render("home"); // Render home page if no product found
        }
    } catch (err) {
        console.error("Error searching:", err);
        res.status(500).send("Internal Server Error"); // Handle server error
    }
});
///////////////////////////////////////////////////////////////////////json insert
// // Insert data into MongoDB
// services.insertMany(productdata)
// .then((insertedDocs) => {
//   console.log('producta inserted successfully:', insertedDocs);
//   mongoose.connection.close(); // Close the connection after insertion
// })
// .catch(err => {
//   console.error('Error inserting products:', err);
//   mongoose.connection.close(); // Close the connection on error
// })
// .catch(err => console.error('MongoDB connection error:', err));
// MongoDB connection and server start
const PORT = process.env.PORT || 9000;
mongoose.connect("mongodb://localhost:27017/jobnest")
.then(() => {
    console.log("Connected to database");

    app.listen(PORT, () => {
        console.log(`Server is running on http://localhost:${PORT}`);
    });
})
.catch((err) => {
    console.error("Database connection error:", err);
});
