const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcrypt')

app.use(express.urlencoded({ extended: true }));

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

  const lecturer = await client.db("ManagementSystem").collection("user").findOne({
      "username": {$eq :req.body.username}
  });
  if (lecturer) {
      const passwordMatch = await bcryptjs.compare(password,lecturer.password);
      if (passwordMatch) {
          res.send("Login successful");
          console.log(username);
      } else {
          res.send("Password does not match");
      }
  } else {
      res.send("Lecturer not found");
  }
});


//show the list names of students who attend class by (username and subject)
app.post('/Lecturer/ViewDetailAttendance', async (req, res) => {
  // Connect the client to the server
  const subject = req.body.subject;
  
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


//show the list students who registered for the subject by (subject)
app.post('/Lecturer/Studentlist', async (req, res) => {
  try {
      const subject = req.body.subject;
      const lecturer = await client.db("ManagementSystem").collection("attendance").find({
          "subject": subject
      }).toArray();

      if (lecturer.length > 0) {
          const studentList = lecturer.map(record => ({
              student_ID: record.student_ID,
              subject: record.subject
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


app.post('/Lecturer/Viewreport', (req, res) => {

  
})


app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
  }); 