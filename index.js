const express = require('express');
const app = express();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const cors = require('cors');
require('dotenv').config()
const port = process.env.PORT || 3000;

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fuph8ia.mongodb.net/?appName=Cluster0`;

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const myDB = client.db("artify120");
const myColl = myDB.collection("artInfo");
const myFav = myDB.collection("favoriteArts");

async function run() {
  try {
  
    app.post('/arts', async(req,res)=>{
        const newArt = {
          ...req.body,
          likes: 0,
          likedBy: []
        }
        const result = await myColl.insertOne(newArt)
        res.send(result)
    })

      app.post('/favorites', async (req, res) => {
          const data = req.body;
          const exists = await myFav.findOne({
            artId: data.artId,
            favorite_by: data.favorite_by
          })

          if (exists) {
            return res.send({ message: "Already favorited" })
          }

          const result = await myFav.insertOne(data);
          res.send(result)
    });

    app.get('/favorites/:id', async(req,res)=>{
        const id = req.params.id
        const query = {_id: new ObjectId(id)}
        const result = await myFav.findOne(query)
        res.send(result)
    })

    app.delete('/favorites/:id', async(req,res)=>{
        const id = req.params.id 
        const query = {_id: new ObjectId(id)}
        const result = await myFav.deleteOne(query)
        res.send(result)
    })

    app.get('/favorites', async(req, res) => {
      const email = req.query.fav
      const query = {}

      if(email){
        query.favorite_by = email
      }

      const cursor =  myFav.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/arts', async(req,res)=>{
      const email = req.query.email
      const query = {}

      if(email){
        query.artistEmail = email
      }

      const cursor = myColl.find(query)
      const result = await cursor.toArray()
      res.send(result)
    })

    app.get('/arts/search', async(req,res)=>{
      const searchText = req.query.title
      const result = await myColl.find({title: {$regex: searchText, $options: "i"}}).toArray()
      res.send(result)
    })

    app.get('/arts/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await myColl.findOne(query)
      res.send(result)
    })

    app.delete('/arts/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const result = await myColl.deleteOne(query)
      res.send(result)
    })

      app.patch('/arts/:id/like', async (req, res) => {
      const id = req.params.id
      const { email } = req.body

      const filter = { _id: new ObjectId(id) }
      const art = await myColl.findOne(filter)

      if (!art) {
        return res.send({ message: 'Not found' })
      }

      let updateDoc;

      if (art.likedBy?.includes(email)) {
        updateDoc = {
          $inc: { likes: -1 },
          $pull: { likedBy: email }
        };
      } 
  
      else {
        updateDoc = {
          $inc: { likes: 1 },
          $addToSet: { likedBy: email }
        };
      }

      const result = await myColl.updateOne(filter, updateDoc)
      res.send(result)
    });

    app.patch('/arts/:id', async(req,res)=>{
      const id = req.params.id
      const query = {_id : new ObjectId(id)}
      const updatedArt = req.body
      console.log(updatedArt)
      const update  = {
        $set: {
          image: updatedArt.image,
          title: updatedArt.title,
          category: updatedArt.category,
          medium: updatedArt.medium,
          artistImage: updatedArt.artistImage,
          description: updatedArt.description
        }
      }
      const result = await myColl.updateOne(query,update)
      res.send(result)
    })

    app.get('/artsHome', async(req,res)=>{
      const cursor = myColl.find().sort({createdAt: -1}).limit(6)
      const result = await cursor.toArray()
      res.send(result)
    })

    await client.connect();
    // await client.db("admin").command({ ping: 1 });
    console.log("Pinged your deployment. You successfully connected to MongoDB!");
  } finally {
      //await client.close();
  }
}
run().catch(console.dir);

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
