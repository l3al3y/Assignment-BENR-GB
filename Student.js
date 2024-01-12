app.post('/students', (req, res) => {
  const student = req.body;
  students.push(student);
  res.send(`Student ${student.name} added`);
});