'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var dns = require('dns');

var cors = require('cors');

var app = express();

// Basic Configuration
var port = process.env.PORT || 3000;
const db_uri = process.env.MONGO_URI;

/** this project needs a db !! **/
mongoose.connect(db_uri, {useNewUrlParser: true});

// creat db model
const Schema = mongoose.Schema;
const urlSchema = new Schema({
  origina: String,
  short: String
});
const ShortUrl = mongoose.model('ShortUrl', urlSchema);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here

app.use(bodyParser.urlencoded({extended: false}));

app.use('/public', express.static(process.cwd() + '/public'));

app.get('/', function(req, res){
  res.sendFile(process.cwd() + '/views/index.html');
});

// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

// shorturl API example: {"original_url":"https://www.baidu.com","short_url":694}
app.post('/api/shorturl/new', (req, res) => {
  let url = req.body.url;
  let urlReg = /(?<=^https?:\/\/)\S+/;
  if (!url.match(urlReg)) {
    res.json({error: 'invalid URL'});
  } else {
    dns.lookup(url.match(urlReg)[0], (err,add,family)=>{
      err?res.json({error:'invalid Hostname'})
          :urlHandler(url);
    });
  };

  const urlHandler = url => {
    ShortUrl.findOne({original:url},(err,data)=>{
      if(err) { // error
        console.log(err);
        res.send('something wrong');
      } else if (data) { // no error and find document
        res.json({
          original: data.original.match(urlReg)[0],
          short_url: data.short
        })
      } else { // no error but no document
        ShortUrl.create({original:url},(e,d)=>{
          if (e) { // error
            res.send('something wrong!')
          } else { // no error
            // create document but no short
            ShortUrl.countDocuments((e,n)=>{
              // count how many documents and assign to document short
              d.short = n;
              d.save((e,d)=>{
                res.json({
                  original:d.original.match(urlReg)[0],
                  short:d.short
                });
              });
            });
          }
        });
      }
    });
  };
});

app.get('/api/shorturl/:short', (req,res)=>{
  ShortUrl.findOne({short:req.params.short},(e,d)=>{
    if (e) {
      res.send('something wrong!');
    } else if (d){
      res.redirect(d.original);
    } else {
      res.json({"error":"No short url found for given input"});
    }
  });
});

app.listen(port, function () {
  console.log('Node.js listening ...');
});
