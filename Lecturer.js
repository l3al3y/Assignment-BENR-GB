const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcrypt')
const jwt = require('jsonwebtoken')

//app.use(express.urlencoded({ extended: true }));

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

app.use(express.json());

app.post('/lecturer', (req, res) => {
    const lecturer = req.body;
  lecturer.push(lecturer);
  res.send(`Lecturer ${lecturer.name} added`);
});

app.post('/Lecturer/login', async (req, res) => {
  // Connect the client to the server 

  const username = req.body.username;
  const password = req.body.password;

  function generateToken(role) {
    const token = jwt.sign({
      role:role
    }, 'secret', { expiresIn: '1h' });
    return token;
  }

  const lecturer = await client.db("ManagementSystem").collection("attendance").findOne({
      "username": {$eq :req.body.username}
  });
  if (lecturer) {
      const passwordMatch = await bcryptjs.compare(password,lecturer.password);
      if (passwordMatch) {
          const token = generateToken(lecturer.role);
          res.send({ token: token, message: "Login successful" });
          console.log(token);
      } else {
          res.send("Password does not match");
      }
  } else {
      res.send("Lecturer not found");
  }
});


//show the list names of students who attend class by (subject only)
app.post('/Lecturer/ViewDetailAttendance', async (req, res) => {
  // Connect the client to the server
  const subject = req.body.subject;

  // Verify the bearer token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized. Missing bearer token.');
  }

  jwt.verify(token, 'secret', (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden. Invalid token.');
    }
  });

  
  try {
      const Subject = await client.db("ManagementSystem").collection("attendance").find({
          "subject": subject
      }).toArray();

      res.send(Subject);
  } catch (error) {
      console.error("Error fetching attendance details:", error);
      res.status(500).send("Internal Server Error");
  }
});


//show the list students who registered for the subject by (subject)done
app.post('/Lecturer/Studentlist', async (req, res) => {
  try {
      const subject = req.body.subject;
      const lecturer = await client.db("ManagementSystem").collection("attendance").find({
          "subject": subject
      }).toArray();

      if (lecturer.length > 0) {
          const studentList = lecturer.map(record => ({
              username: record.username,
              student_ID: record.student_ID,
              subject: record.subject,
              faculty: record.faculty
          }));

          res.send(studentList);
      } else {
          res.send("No students found for the given subject");
      }
  } catch (error) {
      console.error("Error fetching student list:", error);
      res.status(500).send("Internal server error");
  }
});


//app.post('/Lecturer/Viewreport', (req, res) => {

  
//})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  }); 