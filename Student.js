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


app.post('/students/login', async (req, res) => {
  console.log('login',req.body)  
  
  // Connect the client to the server
 
  const {username, password} = req.body;

  function generateToken(role) {
    const token = jwt.sign({
      role:role
    }, 'secret', { expiresIn: '1h' });
    return token;
  }
 
  const Student = await client.db("ManagementSystem").collection("user").findOne({
       "username": {$eq :req.body.username}
  });
  if (Student) {
       const passwordMatch = await bcryptjs.compare(password,Student.password);
       if (passwordMatch) {
           const token = generateToken(Student.role);
           res.send({ token: token, message: "Login successful" });
           console.log(token);
       } else {
           res.send("Password does not match");
       }
  } else {
       res.send("Student not found");
  }
 });


app.post('/students/record-attendance', async (req, res) => {
  const { student_ID, attendance_status,subject,lecturer,faculty } = req.body;
  const attendance_date = new Date();
 
  const validStatuses = ['present', 'absent'];
 
  if (!validStatuses.includes(attendance_status)) {
     return res.status(400).send('Invalid attendance status. Accepted values are "present" or "absent"');
  }

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
 
  const Attendance = client.db("ManagementSystem").collection("user").findOne({
     "student_ID": {$eq : student_ID},
  });
 
  if (Attendance) {
     // Save the attendance record
     const attendance_record = {
       student_ID: student_ID,
       attendance_date: attendance_date,
       attendance_status: attendance_status,
       lecturer: lecturer,
       subject: subject,
       faculty: faculty
     };

     client.db("ManagementSystem").collection("attendance").insertOne(attendance_record);
     res.send("Attendance recorded");

     console.log(attendance_record);
  } else {
     res.send("Student not found ");
  }
});
 });

 app.post('/students/detail-timeline', async (req, res) => {
  const { student_ID = req.body.student_ID } = req.body;

  try {
    const Attendance = await client.db("ManagementSystem").collection("attendance").find({
      "student_ID": student_ID
    }).toArray();

    if (Attendance.length > 0) {
      res.json(Attendance);
    } else {
      res.send("No attendance records found for this student");
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});


app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
});
