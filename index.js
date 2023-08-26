const express = require("express");
const app = express();
const cors = require("cors");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

require("dotenv").config();

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
});

const exerciseSchema = new mongoose.Schema({
  description: {
    type: String,
    required: true,
  },
  duration: {
    type: Number,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  userId: {
    type: String,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
const Exercise = mongoose.model("Exercise", exerciseSchema);

app.use(cors());
app.use(express.static("public"));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

app.get("/api/users", function (req, res) {
  try {
    User.find({}).then((data) => {
      res.json(data);
    });
  } catch (error) {
    res.status(500).end();
  }
});

app.post("/api/users", function (req, res) {
  const { username } = req.body;
  const user = new User({
    username,
  });
  user.save().then((data) => {
    res.json(data);
  });
});

app.get("/api/users/:_id/logs", function (req, res) {
  const { _id } = req.params;
  let { from, to, limit } = req.query;

  from = new Date(from);
  to = new Date(to);

  if (from === "Invalid Date" || to === "Invalid Date") {
    res.json({ error: "From or To query params are invalid" });
  }

  let _limit = 0;
  // if limit is valid
  if (!isNaN(parseInt(limit))) _limit = parseInt(limit);

  User.findById(_id).then((data) => {
    const username = data.username;
    Exercise.find({ userId: _id })
      .limit(_limit)
      .exec()
      .then((data2) => {
        const myLogs = data2.map((elem) => {
          return {
            description: elem.description,
            duration: elem.duration,
            date: elem.date.toDateString(),
          };
        });
        res.json({
          _id,
          username,
          count: data2.length,
          log: myLogs,
        });
      });
  });
});

app.post("/api/users/:_id/exercises", function (req, res) {
  const id = req.params._id;
  let { description, duration, date } = req.body;
  if (!date) date = new Date();
  User.findById(id)
    .then((data) => {
      const { _id, username } = data;

      const exercise = new Exercise({
        description,
        duration,
        date,
        userId: id,
      });

      exercise
        .save()
        .then((_data) => {
          res.json({
            _id,
            username,
            date: new Date(date).toDateString(),
            duration: _data.duration,
            description: _data.description,
          });
        })
        .catch((err) => {
          res.status(500).end();
        });
    })
    .catch((err) => {
      res.status(500).end();
    });
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
