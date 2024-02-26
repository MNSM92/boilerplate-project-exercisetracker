const express = require('express')
const app = express()
const cors = require('cors')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const User = require('./schema/user.schema');
require('dotenv').config()

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error(err));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());


app.post('/api/users', (req, res) => {
  const username = req.body.username;
  const newUser = new User({ username });
  let _id;

  newUser.save()
    .then(user => {
      res.json({username, _id: user._id });
    })
    .catch(err => res.status(500).json(err));
});

app.get('/api/users', (req, res) => {
  User.find({ username: { $exists: true } })
    .select('_id username')
    .then(users => {
      res.json(users);
    })
    .catch(err => {
      res.status(500).json(err);
    });
});

app.post('/api/users/:_id/exercises', (req, res) => {
  const { _id } = req.params;
  const { description, duration, date } = req.body;
  
  User.findById(_id)
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const exercise = {
        description,
        duration: parseInt(duration),
        date: date ? new Date(date) : new Date()
      };
      
      user.exercises.push(exercise);
      
      user.save()
        .then(savedUser => {
          res.json({
            _id: savedUser._id,
            username: savedUser.username,
            description: exercise.description,
            duration: exercise.duration,
            date: exercise.date.toDateString()
          });
        })
        .catch(err => {
          res.status(500).json({ error: err.message });
        });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});

app.get('/api/users/:_id/logs', (req, res) => {
  const { _id } = req.params;
  const { from, to, limit } = req.query;

  User.findById(_id)
    .then(user => {
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let log = user.exercises.slice();

      if (from) {
        log = log.filter(exercise => new Date(exercise.date) >= new Date(from));
      }

      if (to) {
        log = log.filter(exercise => new Date(exercise.date) <= new Date(to));
      }

      if (limit) {
        log = log.slice(0, parseInt(limit));
      }

      const count = log.length;

      log = log.map(exercise => ({
        description: exercise.description,
        duration: exercise.duration,
        date: exercise.date.toDateString()
      }));

      res.json({
        _id: user._id,
        username: user.username,
        count,
        log
      });
    })
    .catch(err => {
      res.status(500).json({ error: err.message });
    });
});



const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
