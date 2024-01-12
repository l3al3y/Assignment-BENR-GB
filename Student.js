const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcryptjs')

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


app.post('/students/login', async (req, res) => {
  // Connect the client to the server

  const username = req.body.username;
  const password = req.body.password;

  const admin = await client.db("ManagementSystem").collection("user").findOne({
      "username": {$eq :req.body.username}
  });
  if (admin) {
      const passwordMatch = await bcryptjs.compare(password,user.password);
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


app.post('/students/record-attendance', async (req, res) => {
  const { student_ID, attendance_status } = req.body;
  const attendance_date = new Date();
 
  const validStatuses = ['present', 'absent'];
 
  if (!validStatuses.includes(attendance_status)) {
     return res.status(400).send('Invalid attendance status. Accepted values are "present" or "absent"');
  }
 
  const Attendance = await client.db("ManagementSystem").collection("user").findOne({
     "student_ID": {$eq : student_ID},
  });
 
  if (Attendance) {
     // Save the attendance record
     const attendance_record = {
       student_ID: student_ID,
       attendance_date: attendance_date,
       attendance_status: attendance_status
     };
     await client.db("ManagementSystem").collection("attendance").insertOne(attendance_record);
 
     res.send("Attendance recorded");
     console.log(username);
  } else {
     res.send("Student not found ");
  }
 });



app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
