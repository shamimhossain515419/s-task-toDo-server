const express = require('express')
const cors = require('cors')
const app = express();
var jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;
app.use(cors())

app.use(express.json());




const uri = `mongodb+srv://${process.env.USER}:${process.env.PASSWORD}@cluster0.jt15atw.mongodb.net/?retryWrites=true&w=majority`;

// verifyJWT 
const verifyJWT = (req, res, next) => {
     const authorization = req.headers.authorization;
     if (!authorization) {
          return res.status(401).send({ error: true, message: 'unauthorized access' });
     }
     // bearer token
     const token = authorization.split(' ')[1];

     jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
          if (err) {
               return res.status(401).send({ error: true, message: 'unauthorized access' })
          }
          req.decoded = decoded;
          next();
     })
}

// Create a MongoClient with a MongoClientOptions object to set the Stable API version

const client = new MongoClient(uri, {
     serverApi: {
          version: ServerApiVersion.v1,
          strict: true,
          deprecationErrors: true,
     }
});


async function run() {
     //   try {
     // Connect the client to the server	(optional starting in v4.7)
     // await client.connect();
     // Send a ping to confirm a successful connection

     const TaskCollection = client.db("TaskToDO").collection("task");
     const UserCollection = client.db("TaskToDO").collection("User");
     //  JWT token 
     app.post('/jwt', (req, res) => {
          const user = req.body;
          const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '10d' })
          res.send({ token })
     })



     // task related API 


     app.get('/task/:email', verifyJWT, async (req, res) => {
          const query = { email: req.params.email }
          const result = await TaskCollection.find(query).toArray();
          res.send(result)

     })


     app.get('/taskSingle/:id', async (req, res) => {
          const query = { _id: new ObjectId(req?.params?.id) }
          const result = await TaskCollection.findOne(query)
          res.send(result)

     });


     app.post('/task', verifyJWT, async (req, res) => {
          const body = req.body;
          const result = await TaskCollection.insertOne(body)
          res.send(result)
     })

     app.delete('/task/:id', verifyJWT, async (req, res) => {
          const query = { _id: new ObjectId(req.params.id) }
          const result = await TaskCollection.deleteOne(query)
          res.send(result)

     })


     app.put('/task/:id', verifyJWT, async (req, res) => {
          const body = req.body;
          const filter = { _id: new ObjectId(req.params.id) };
          const options = { upsert: true };
          const upItem = {
               $set: {
                    title: body.title,
                    description: body.description,
                    date: body.date,
                    name: body.name,
                    email: body.email,
                    time: body.time,
                    status: body.status

               }
          }

          const result = await TaskCollection.updateOne(filter, upItem, options);
          res.send(result)

     })

     app.patch('/task/:id', verifyJWT, async (req, res) => {
          const id = req.params.id;
          const filter = { _id: new ObjectId(id) };
          const updateDoc = {
               $set: {
                    status: "Complete"
               },
          };
          const result = await TaskCollection.updateOne(filter, updateDoc);
          res.send(result);
     })

     // user relateAPI 
     app.post('/user', verifyJWT, async (req, res) => {
          const body = req.body;
          const result = await UserCollection.insertOne(body);
          res.send(result);
     })
     app.get('/user/:email', verifyJWT, async (req, res) => {
          const email = { email: req.params.email }

          const result = await UserCollection.findOne(email);
          res.send(result);
     })

     await client.db("admin").command({ ping: 1 });
     console.log("Pinged your deployment. You successfully connected to MongoDB!");

}
run().catch(console.dir);


app.get('/', function (req, res, next) {

     res.send("hello")
})

app.listen(port, function () {
     console.log(` CORS-enabled web server listening on port  ${port}`)
})