const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcrypt')
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


app.post('/admin', (req, res) => {
    const admin = req.body;
    students.push(student);
    res.send(`Admin ${admin.name} added`);
});

app.post('/login', (req, res) => {
    client.db("ManagementSystem").collection("users").find({
      "username": { $eq: req.body.username }
    }).toArray().then((result) => {
      if (result.length > 0) {
        res.status(400).send('Username already exists')
      } else {
        const {username,password,student_ID,role,}=req.body
        const hash= bcryptjs.hashSync(password,10);
        client.db("ManagementSystem").collection("users").insertOne({
          "username": SyamimZaki,
          "password": hash,
          "student_ID":B022210085,
          "role": role
        })

        res.send('Register successfully')
      }
   })
  })

app.post('/Admin/AddStudent', (req, res) => {
    const { username, password } = req.body
    console.log(username, password);

    const hash = bcryptjs.hashSync(password, 10);
    client.db("ManagementSystem").collection("users").
        insertOne({ "username": req.body.username, "password": hash });
    res.send('Register successfully');
    console.log(hash);
})

app.post('/View Detail', (req, res) => {


})

app.post('/Admin/StudentList', (req, res) => {


})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  }); 
  