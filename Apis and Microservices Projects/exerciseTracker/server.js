const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const shortid = require('shortid')

const cors = require('cors')

const mongoose = require('mongoose')
mongoose.connect(process.env.MONGO_URI,{useNewUrlParser:true})

app.use(cors())

app.use(bodyParser.urlencoded({extended: false}))
app.use(bodyParser.json())


app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

app.post('/api/exercise/new-user',(req,res,next)=>{
  User.findOne({username:req.body.username}).exec((e,d)=>{
    if (e) next(e);
    if (d) {
      next({status: 400,message: 'username already taken'})
    } else {
      User.create({username:req.body.username},(err,data)=>{
        if (err) next(err);
        res.json({username:data.username,_id:data.id})
      })
    }
  })
});

app.post('/api/exercise/add',(req,res,next)=>{
  console.log(1,req.body)
  User.findOne({id:req.body.userId}).exec((e,ud)=>{
    if (e) next(e);
    console.log(ud)
    if (!ud) {
      next({status:400,message:'unknow id'})
    } else {
      console.log(2,req.body)
      if (!req.body.date) req.body.date=new Date();
      console.log(3,req.body)
      Exercise.create(req.body,(e,ed)=>{
        if (e) next(e);
        res.json({
          username: ud.username,
          _id: ed.userId,
          description: ed.description,
          duration: ed.duration,
          date: ed.date.toDateString()
        })
      })
    }
  })
})

app.get('/api/exercise/users',(req,res,next)=>{
  User.find({},'username id -_id').exec((e,d)=>{
    if (e) next(e);
    res.json(d);
  })
})

app.get('/api/exercise/log', (req,res,next)=>{
  const from = new Date(req.query.from)
  const to = new Date(req.query.to)
  const uid = req.query.userId
  User.findOne({id:uid},(e,ud)=>{
    if (e) next(e);
    if (!ud) {
      next({status:400,message:'unknow id'})
    } else {
      Exercise.find({
        userId: ud.id,
        date: {
          $lt: to != 'Invalid Date' ? to.getTime() : Date.now() ,
          $gt: from != 'Invalid Date' ? from.getTime() : 0
        }
      })
      .sort('-date')
      .limit(parseInt(req.query.limit))
      .exec((e,ed)=>{
        if (e) next(e);
        res.json({
          username: ud.username,
          _id: ud.id,
          from: from!= 'Invalid Date'?from.toDateString():undefined,
          to: to!='Invalid Date'?to.toDateString():undefined,
          count: ed.length,
          log: ed.map(i=>(
            {
              description: i.description,
              duration: i.duration,
              date: i.date.toDateString()
            }
          ))
        })
      })
    }
  })
})

// Not found middleware
app.use((req, res, next) => {
  return next({status: 404, message: 'not found'})
})

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;
  if (err.errors) {
    // mongoose validation error
    errCode = 400 // bad request
    const keys = Object.keys(err.errors)
    // report the first validation error
    errMessage = err.errors[keys[0]].message
  } else {
    // generic or custom error
    errCode = err.status || 500
    errMessage = err.message || 'Internal Server Error'
  }
  res.status(errCode).type('txt')
    .send(errMessage)
})

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

const Schema = mongoose.Schema;

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    maxlength:[20, 'username too long']
  },
  id: {
    type: String,
    default: shortid.generate
  }
});

const exerciseSchema = new Schema({
  userId: {
    type: String,
  },
  username: String,
  description: {
    type: String,
    required: true,
    maxlength: [20, 'description too long']
  },
  duration: {
    type: Number,
    required: true,
    min: [1, 'duration too short']
  },
  date: {
    type: Date,
    default: Date.now()
  }
})

const User = mongoose.model('User', userSchema)
const Exercise = mongoose.model('Exercise', exerciseSchema)
