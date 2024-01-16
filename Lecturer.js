const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcrypt')
const jwt = require('jsonwebtoken')

const { MongoClient, ServerApiVersion } = require('mongodb');
const uri = "mongodb+srv://groupb:abc12345@groupb.6djtmth.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

async function run() {
  try {
    await client.connect();
    await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {

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
app.post('/Lecturer/ViewAttendanceStudent', async (req, res) => {
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


//show the list students who registered for each subject
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


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  }); 