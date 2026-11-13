const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
app.use(express.json());
app.use(cors());

// Connect to MongoDB Compass
mongoose.connect('mongodb://localhost:27017/strumDB')
    .then(() => console.log('Connected to MongoDB successfully!'))
    .catch(err => console.error('Connection error:', err));

// Customer Schema & Model
const customerSchema = new mongoose.Schema({
    name: String,
    age: Number,
    level: String,
    city: String,
    email: { type: String, unique: true },
    password: String
});

const Customer = mongoose.model('Customer', customerSchema);

// Password hashing (built into Node, no extra install needed)
function hashPassword(password) {
    const salt = crypto.randomBytes(16).toString('hex');
    const hash = crypto.scryptSync(password, salt, 64).toString('hex');
    return salt + ':' + hash;
}

function checkPassword(password, stored) {
    const [salt, hash] = stored.split(':');
    const test = crypto.scryptSync(password, salt, 64).toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(test, 'hex'));
}

// Registration Route
app.post('/api/register', async (req, res) => {
    try {
        const { name, age, level, city, email, password } = req.body;
        const newCustomer = new Customer({
            name, age, level, city, email,
            password: hashPassword(password)
        });
        await newCustomer.save();
        res.json({ success: true, message: "Welcome to Strum! Registration successful." });
    } catch (err) {
        res.json({ success: false, message: "Error: Email might already exist." });
    }
});

// Login Route
app.post('/api/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const customer = await Customer.findOne({ email });

        if (customer && checkPassword(password, customer.password)) {
            // Never send the password back to the browser
            const { name, city, level } = customer;
            res.json({ success: true, customer: { name, email: customer.email, city, level } });
        } else {
            res.json({ success: false, message: "Invalid Email or Password!" });
        }
    } catch (err) {
        res.json({ success: false, message: "Server error." });
    }
});

app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});
