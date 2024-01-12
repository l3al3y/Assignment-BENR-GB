app.post('/admin', (req, res) => {
    const admin = req.body;
    students.push(student);
    res.send(`Admin ${admin.name} added`);
  });
  