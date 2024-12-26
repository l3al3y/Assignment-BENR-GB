require('dotenv').config(); // Load environment variables
const express = require('express');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { MongoClient, ServerApiVersion } = require('mongodb');

const app = express();
const port = process.env.PORT || 3000;

// MongoDB configuration
const uri = process.env.MONGODB_URI;
const jwtSecret = process.env.JWT_SECRET;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

// Connect to MongoDB
async function connectToDatabase() {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (err) {
    console.error("Failed to connect to MongoDB:", err);
    process.exit(1); // Exit process on failure
  }
}
connectToDatabase();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// JWT Authentication Middleware
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized. Missing token.');
  }

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden. Invalid token.');
    }
    req.user = user; // Attach user details to the request
    next();
  });
}

// Generate JWT Token
function generateToken(role) {
  return jwt.sign({ role }, jwtSecret, { expiresIn: '10m' });
}

// Admin Add User
app.post('/admin/adduser', authenticateToken, async (req, res) => {
  try {
    const { username, password, student_ID, role, faculty, staff_ID } = req.body;

    // Check if username already exists
    const existingUser = await client.db("ManagementSystem").collection("user").findOne({ username });
    if (existingUser) {
      return res.status(400).send("Username already exists");
    }

    // Hash password and generate unique secret key
    const hashedPassword = bcryptjs.hashSync(password, 10);
    const uniqueSecretKey = crypto.randomBytes(16).toString('hex');

    // Insert user into database
    await client.db("ManagementSystem").collection("user").insertOne({
      username,
      password: hashedPassword,
      student_ID,
      staff_ID,
      role,
      faculty,
      uniqueSecretKey
    });

    res.status(201).send({
      message: "User added successfully",
      uniqueSecretKey
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin Login
app.post('/admin/login', async (req, res) => {
  const { username, password, uniqueSecretKey } = req.body;

  try {
    const admin = await client.db("ManagementSystem").collection("user").findOne({ username });
    if (!admin) {
      return res.status(404).send("User not found");
    }

    // Validate password
    const passwordMatch = await bcryptjs.compare(password, admin.password);
    if (!passwordMatch) {
      return res.status(401).send("Password does not match");
    }

    // Validate unique secret key
    if (admin.uniqueSecretKey !== uniqueSecretKey) {
      return res.status(401).send("Invalid unique secret key");
    }

    // Generate and send JWT
    const token = generateToken(admin.role);
    res.status(200).send({ token, message: "Login successful" });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin Delete User
app.delete('/admin/deleteuser/:id', authenticateToken, async (req, res) => {
  const userId = req.params.id;

  try {
    const result = await client.db("ManagementSystem").collection("user").deleteOne({ student_ID: userId });

    if (result.deletedCount > 0) {
      res.send(`User with ID ${userId} deleted successfully`);
    } else {
      res.send(`User with ID ${userId} not found`);
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin View User Details
app.get('/admin/viewdetail', authenticateToken, async (req, res) => {
  const { role } = req.query;

  try {
    const users = await client.db("ManagementSystem").collection("user").find({ role }).toArray();
    res.status(200).json(users);
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Admin Update User
app.patch('/admin/updateuser', authenticateToken, async (req, res) => {
  const { username, email, student_ID, role } = req.body;

  try {
    const result = await client.db("ManagementSystem").collection("user").updateOne(
      { username },
      { $set: { email, student_ID, role } }
    );

    if (result.modifiedCount > 0) {
      res.send("User updated successfully");
    } else {
      res.send("No changes made or user not found");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
