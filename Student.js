const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcryptjs')


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


app.post('/login', async (req, res) => {
    const {email, password} = req.body;
    const hash = await bcryptjs.hash(password, 10);
    const admin = await client.db("admin").collection("admin").findOne({email: email});
    if (admin) {
        const passwordMatch = await bcryptjs.compare(password, admin.password);
        if (passwordMatch) {
            res.send("Login successful");
        } else {
            res.send("Password does not match");
        }
    } else {
        res.send("Admin not found");
    }
})