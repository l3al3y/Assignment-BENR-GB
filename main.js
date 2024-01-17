const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')

app.use(express.json());

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://groupb:abc12345@groupb.6djtmth.mongodb.net/?retryWrites=true&w=majority";

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
    // Ensures that the client will close when you finish/error
    //await client.close();
  }
}
run().catch(console.dir);


function generateToken(role) {
  const token = jwt.sign({
    role:role
  }, 'secret', { expiresIn: '1m' });
  return token;
}

app.post('/login', async (req, res) => {
  const {username, password} = req.body;
  console.log('login',req.body)

  const user = await client.db("ManagementSystem").collection("user").findOne({
    "username": req.body.username
  });
  
  if (user) {
    if (user.username === 'admin') {
      user.role = 'admin';
    } else if (user.username === 'student') {
      user.role = 'student';
    } else if (user.username === 'teacher') {
      user.role = 'teacher';
    }
  
    const passwordMatch = await bcryptjs.compare(password, user.password);
  
    if (passwordMatch) {
      const token = generateToken(user.role);
      res.send({ token: token, message: "Login successful" });
      console.log(token);
    } else {
      res.send("Password does not match");
    }
  } else {
    res.send("User not found");
  }});

  app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
  })