app.post('/deleteprogram', async (req, res) => {
    const programId = req.body.program;
  
    try {
      const result = await client.db("ManagementSystem").collection("faculty").deleteOne({
        "program": programId
      });
  
      if (result.deletedCount > 0) {
        res.send(`User with ID ${programId} deleted successfully`);
      } else {
        res.send(`User with ID ${programId} not found`);
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
        res.status(400).send('ID already exists')
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
  