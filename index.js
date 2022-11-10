const express = require("express");
const app = express();
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const { query } = require("express");
const jwt = require("jsonwebtoken");
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
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader)
    return res.status(401).send({ message: "Unauthorized access." });
  const token = authHeader.split(" ")[1];
  jwt.verify(
    token,
    process.env.ACCESS_TOKEN_SECRET,
    function (error, decrypted) {
      if (error) return res.status(403).send({ message: "Forbidden access." });
      req.decrypted = decrypted;
      next();
    }
  );
}
async function run() {
  try {
    const database = client.db("Tommy's-Photography-DB");
    const serviceCollection = database.collection("services");
    const reviewCollection = database.collection("reviews");

    app.post("/jwt", (req, res) => {
      const user = req.body;
      const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d",
      });
      res.send({ token });
    });
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
    app.post("/services", verifyJWT, async (req, res) => {
      const service = req.body;
      const result = await serviceCollection.insertOne(service);
      res.send(result);
    });
    app.post("/reviews", verifyJWT, async (req, res) => {
      const review = req.body;
      const result = await reviewCollection.insertOne(review);
      res.send(result);
    });
    app.get("/reviews", async (req, res) => {
      const query = {};
      const cursor = reviewCollection.find(query).sort({ date: -1 });
      const allReviews = await cursor.toArray();
      res.send(allReviews);
    });
    app.get("/myreviews", verifyJWT, async (req, res) => {
      const decrypted = req.decrypted;
      const { email } = req.query;
      if (decrypted.email !== email)
        return res.status(403).send({ message: "Invalid Token" });
      const query = { email };
      const cursor = reviewCollection.find(query).sort({ date: -1 });
      const myReviews = await cursor.toArray();
      res.send(myReviews);
    });
    app.get("/reviews/:id", async (req, res) => {
      const serviceId = req.params.id;
      const query = { service_id: serviceId };
      const cursor = reviewCollection.find(query);
      const serviceReview = await cursor.toArray();
      res.send(serviceReview);
    });
    app.put("/reviews/:id", verifyJWT, async (req, res) => {
      const newReview = req.body;
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const update = { $set: newReview };
      const result = await reviewCollection.updateOne(filter, update);
      res.send(result);
    });
    app.delete("/reviews/:id", verifyJWT, async (req, res) => {
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
