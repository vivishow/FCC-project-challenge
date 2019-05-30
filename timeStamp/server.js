// server.js
// where your node app starts

// init project
var express = require('express');
var app = express();

// enable CORS (https://en.wikipedia.org/wiki/Cross-origin_resource_sharing)
// so that your API is remotely testable by FCC
var cors = require('cors');
app.use(cors({optionSuccessStatus: 200}));  // some legacy browsers choke on 204

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get("/", function (req, res) {
  res.sendFile(__dirname + '/views/index.html');
});


// your first API endpoint...
app.get("/api/hello", function (req, res) {
  res.json({greeting: 'hello API'});
});

app.get('/api/timestamp/:date_string?',(req,res)=>{

  const getJson = date => {

    const testISO = /\d{4}-\d{2}-\d{2}/;
    const testStamp = /\d{13}/;

    let time = date?(
      testISO.test(date)?new Date(date):
      testStamp.test(date)?new Date(Number(date)):''
      )
      :new Date();

    return time?{'unix':time.getTime(),'utc':time.toUTCString()}:{'error':'Invalid Date'};
  };

  res.json(getJson(req.params.date_string));

});

// listen for requests :)
var listener = app.listen(process.env.PORT, function () {
  console.log('Your app is listening on port ' + listener.address().port);
});
