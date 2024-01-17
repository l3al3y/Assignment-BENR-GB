const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcrypt')


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

app.post('/admin', (req, res) => {
  const admin = req.body;
  students.push(student);
  res.send(`Admin ${admin.name} added`);
});

app.post('/admin/adduser', (req, res) => {
  client.db("ManagementSystem").collection("user").find({
    "username": { $eq: req.body.username }
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(400).send('Username already exists')
    } else {
      const { username, password, student_ID, role,faculty } = req.body
      const hash = bcryptjs.hashSync(password, 10);
      client.db("ManagementSystem").collection("user").insertOne({
        "username": username,
        "password": hash,
        "student_ID": student_ID,
        "role": role,
        "faculty": faculty
      })
      res.send('Register successfully')
    }
  })
})

app.post('/admin/login', async (req, res) => {
  // Connect the client to the server

  const username = req.body.username;
  const password = req.body.password;

  const admin = await client.db("ManagementSystem").collection("attendance").findOne({
    "username": { $eq: req.body.username }
  });
  if (admin) {
    const passwordMatch = await bcryptjs.compare(password, admin.password);
    if (passwordMatch) {
      res.send("Login successful");
      console.log(username);
    } else {
      res.send("Password does not match");
    }
  } else {
    res.send("Student not found");
  }
});



app.get('/admin/viewdetailstudent', async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const studentCollection = client.db("ManagementSystem").collection("attendance");
    const student = await studentCollection.findOne({ "student_ID": studentId });

    if (student) {
      res.json(student);
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    console.error("Error fetching student details:", error);
    res.status(500).send("Internal server error");
  }
});

/*app.get('/admin/list', async (req, res) => {
  try {
    const studentCollection = client.db("ManagementSystem").collection("attendance");
    const students = await studentCollection.find().toArray();

    if (students.length > 0) {
      res.json(students);
    } else {
      res.send("No students found in the system");
    }
  } catch (error) {
    console.error("Error fetching student list:", error);
    res.status(500).send("Internal server error");
  }
});*/

app.get('/admin/list', async (req, res) => {
  try {
      const student_ID = req.body.student_ID;
      const admin = await client.db("ManagementSystem").collection("attendance").find({
          "student_ID": student_ID
      }).toArray();

      if (admin.length > 0) {
          const studentList = admin.map(record => ({
              student_ID: record.student_ID,
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

app.delete('/admin/deletestudent/:studentId', async (req, res) => {
  const studentId = req.params.studentId;

  try {
    const studentCollection = client.db("ManagementSystem").collection("attendance");
    const result = await studentCollection.deleteOne({ "student_ID": studentId });

    if (result.deletedCount > 0) {
      res.send(`Student with ID ${studentId} deleted successfully`);
    } else {
      res.status(404).send("Student not found");
    }
  } catch (error) {
    console.error("Error deleting student:", error);
    res.status(500).send("Internal server error");
  }
});


app.patch('/admin/Update', (req, res) => {
  client.db("ManagementSystem").collection("attendance").updateOne({
    "username": { $eq: req.body.username }}, 
    {
    $set: {
      "email": req.body.email,
      "student_ID": req.body.student_ID,
      "role": req.body.role,

     },

  }).then(result => {
    res.send('Update successfully')
  })
})


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
