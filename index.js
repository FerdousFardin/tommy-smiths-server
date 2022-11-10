const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
require("dotenv").config();
const port = process.env.PORT || 5000;
//middleware
app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.bg9iiek.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1,
});
async function run() {
  try {
    const database = client.db("Tommy's-Photography-DB");
    const serviceCollection = database.collection("services");
    const reviewCollection = database.collection("reviews");

    app.get("/services", async (req, res) => {
      const limit = req.query.limit;
      const query = {};
      const cursor = serviceCollection.find(query).sort({ date: -1 });
      const services = limit
        ? await cursor.limit(+limit).toArray()
        : await cursor.toArray();
      res.send(services);
    });
    app.get("/service/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = serviceCollection.find(query);
      const service = await cursor.toArray();
      res.send(service);
    });
    app.post("/services", async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const { email } = req.query;
      const query = email ? { email } : {};
      // const cursor = reviewCollection.find(query);
      const cursor = reviewCollection.find(query).sort({ date: -1 });
      const allReviews = await cursor.toArray();
      res.send(allReviews);
    });
    app.get("/reviews/:id", async (req, res) => {
      const serviceId = req.params.id;
      const query = { service_id: serviceId };
      const cursor = reviewCollection.find(query);
      const serviceReview = await cursor.toArray();
      res.send(serviceReview);
    });
    app.put("/reviews/:id", async (req, res) => {
      const newReview = req.body;
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const update = { $set: newReview };
      const result = await reviewCollection.updateOne(filter, update);
      res.send(result);
    });
    app.delete("/reviews/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await reviewCollection.deleteOne(query);
      res.send(result);
    });
  } finally {
  }
}
run().catch((er) => console.error(er));

app.get("/", (req, res) => {
  res.send("Server is running");
});
app.listen(port, () => {});
