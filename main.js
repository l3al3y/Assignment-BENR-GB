const express = require('express')
const app = express()
const port = process.env.PORT || 3000;
const bcryptjs = require('bcryptjs')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit');
const validator = require('validator');

app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(express.static('public'))

const secret = ']22Ck)32Sem8';

const { MongoClient, ServerApiVersion, Code } = require('mongodb');
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
    role: role
  }, secret, { expiresIn: '10m' });
  return token;
}

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per `window` (here, per 15 minutes)
  message: 'Too many login attempts from this IP, please try again after 15 minutes'
});

//LOGIN SECTION FOR 3 TYPES OF USERS(ADMIN,STUDENT,LECTURER)

app.post('/login', loginLimiter, async (req, res) => {
  const { username, password } = req.body;
  console.log('login', req.body)
  const user = await client.db("ManagementSystem").collection("user").findOne({
    "username": req.body.username
  });

  if (user) {
    if (user.username === 'admin') {
      user.role = 'admin';
    } else if (user.username === 'student') {
      user.role = 'student';
    } else if (user.username === 'lecturer') {
      user.role = 'lecturer';
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
  }
});

//ADMIN SECTION FOR ADDING USER AND VIEWING ATTENDANCE LIST

app.post('/adduser', (req, res) => {
  client.db("ManagementSystem").collection("user").find({
    "username": { $eq: req.body.username }
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(400).send('ID already exists')
    } else {
      const { username, password, student_ID, role, faculty, staff_ID } = req.body

      // Password strength validation
      if (!validator.isStrongPassword(password, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1
      })) {
        return res.status(400).send('Password is not strong enough. It should be at least 8 characters long and include at least one lowercase letter, one uppercase letter, one number, and one symbol.');
      }
      
      const hash = bcryptjs.hashSync(password, 10);
      client.db("ManagementSystem").collection("user").insertOne({
        "username": username,
        "password": hash,
        "student_ID": student_ID,
        "staff_ID": staff_ID,
        "role": role,
        "faculty": faculty
      })
      res.send('Register successfully')
    }
  })
});

//ADMIN SECTION FOR VIEWING ATTENDANCE LIST

app.get('/list', async (req, res) => {
  const { subject } = req.body;

  // Verify the bearer token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized. Missing bearer token.');
  }

  jwt.verify(token, secret, (err, user) => {
    if (err) {
      return res.status(403).send('Forbidden. Invalid token.');
    }
  });
  try {
    const List = await client.db("ManagementSystem").collection("attendance").find({
      "subject": subject,

    }).toArray();

    if (List) {
      res.json(List);
    } else {
      res.send("No record for this subject");
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

//LECTURER SECTION FOR VIEWING ATTENDANCE LIST

app.post('/ViewAttendanceStudent', async (req, res) => {
  //BODY FOR POSTMAN TESTING
  const subject = req.body.subject;

  // Verify Token
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized. Missing bearer token.');
  }

  jwt.verify(token, secret, (err, user) => {
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

//LECTURER SECTION FOR VIEWING STUDENT LIST

app.post('/Studentlist', async (req, res) => {
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

//STUDENT SECTION FOR RECORDING ATTENDANCE

function authenticateStudent(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).send('Unauthorized. Missing bearer token.');
  }

  try {
    const user = jwt.verify(token, secret);
    if (user.role !== 'student') {
      return res.status(403).send('Forbidden. Only students can record attendance.');
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).send('Forbidden. Invalid token.');
  }
}

app.post('/record-attendance', authenticateStudent, async (req, res) => {
  const { username, student_ID, attendance_status, subject, lecturer, faculty } = req.body;
  const attendance_date = new Date();

  const validStatuses = ['present', 'absent'];

  if (!validStatuses.includes(attendance_status)) {
    return res.status(400).send('Invalid attendance status. Accepted values are "present" or "absent"');
  }

  try {
    const student = await client.db("ManagementSystem").collection("attendance").findOne({ 
      "student_ID": student_ID 
    });
    if (student) {
      res.send("Attendance already recorded");
    }
    else {
      const result = await client.db("ManagementSystem").collection("attendance").insertOne({
        "username": username,
        "student_ID": student_ID,
        "attendance_status": attendance_status,
        "attendance_date": attendance_date,
        "subject": subject,
        "lecturer": lecturer,
        "faculty": faculty
      });
      res.send("Attendance recorded");
      console.log(result);
    }

  } catch (err) {
    return res.status(500).send("Error occurred while recording attendance");
  }
});





//STUDENT SECTION FOR VIEWING DETAIL TIMELINE

app.post('/detail-timeline', async (req, res) => {
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

//DELETE USER BASED ON ID
app.post('/deleteuser', async (req, res) => {
  const userId = req.body.student_ID;

  try {
    const result = await client.db("ManagementSystem").collection("user").deleteOne({
      "student_ID": userId
    });

    if (result.deletedCount > 0) {
      res.send(`User with ID ${userId} deleted successfully`);
    } else {
      res.send(`User with ID ${userId} not found`);
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.post('/addprogram', (req, res) => {
  client.db("ManagementSystem").collection("faculty").find({
    "program": { $eq: req.body.program}
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(400).send('Program already exists')
    } else {
      const { program,lecturer } = req.body
      client.db("ManagementSystem").collection("faculty").insertOne({
        "program": program,
        "lecturer": lecturer,
      })
      res.send('Register successfully')
    }
  })
}); 

app.post('/deleteprogram', async (req, res) => {
  const programId = req.body.program;

  try {
    const result = await client.db("ManagementSystem").collection("faculty").deleteOne({
      "program": programId
    });

    if (result.deletedCount > 0) {
      res.send(`Program with ID ${programId} deleted successfully`);
    } else {
      res.send(`Program with ID ${programId} not found`);
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.post('/addsubject', (req, res) => {
  client.db("ManagementSystem").collection("faculty").find({
    "subject": { $eq: req.body.subject}
  }).toArray().then((result) => {
    if (result.length > 0) {
      res.status(400).send('Subject already exists')
    } else {
      const { subject,lecturer,subjectID } = req.body
      client.db("ManagementSystem").collection("faculty").insertOne({
        "subject": subject,
        "lecturer": lecturer,
        "subjectID":subjectID
      })
      res.send('Register successfully')
    }
  })
});

app.post('/deletesubject', async (req, res) => {
  const subjectId = req.body.subject;

  try {
    const result = await client.db("ManagementSystem").collection("faculty").deleteOne({
      "subject": subjectId
    });

    if (result.deletedCount > 0) {
      res.send(`Subject ${subjectId} deleted successfully`);
    } else {
      res.send(`Subject ${subjectId} not found`);
    }
  } catch (error) {
    res.status(500).send("Internal server error");
  }
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
}
);