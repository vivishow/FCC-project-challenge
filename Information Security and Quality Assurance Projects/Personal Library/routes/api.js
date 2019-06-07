/*
*
*
*       Complete the API routing below
*       
*       
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;
const MONGODB_CONNECTION_STRING = process.env.DB;
//Example connection: MongoClient.connect(MONGODB_CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  MongoClient.connect(MONGODB_CONNECTION_STRING,{useNewUrlParser:true},(err, client)=>{
    
    if (err) console.log(err);
    const db = client.db('fcc');
    const bookCol = db.collection('books');
    const commentCol = db.collection('comments');
    
    app.route('/api/books')
      .get(function (req, res){
        //response will be array of book objects
        //json res format: [{"_id": bookid, "title": book_title, "commentcount": num_of_comments },...]
        (async () => {
          let books = await bookCol.find({}).toArray();
          let commentCount = await Promise.all(books.map(b=>commentCol.countDocuments({id:b._id})));
          res.json(books.map((b,i)=>{
            return {...b,commentcount:commentCount[i]}
          }));
        })().catch(e=>{
          console.log(e);
          res.send('error');
        });
      })

      .post(function (req, res){
        var title = req.body.title;
        //response will contain new book object including atleast _id and title
        title?
        bookCol.insertOne({title:title}).then(book=>{
          res.json({...book.ops[0],comments:[]});
        }).catch(e=>{
          console.log(e);
          res.send('error!');
        }):
        res.send('missing title');
      })

      .delete(function(req, res){
        //if successful response will be 'complete delete successful'
        (async () => {
          let r = await Promise.all([bookCol.deleteMany({}),commentCol.deleteMany({})]);
          if (r.every(i=>i.result.ok===1)) res.send('complete delete successful');
          else res.send('error');
        })().catch(e=>{
          console.log(e);
          res.send('error');
        });
      });

    const getBookInfo = async id => {
      let book = await bookCol.findOne({_id:ObjectId(id)});
      if (book) {
        let comments = await commentCol.find({id:book._id}).toArray();
        return {...book,comments:comments.map(c=>c.comment)};
      } else {
        return false;
      }
    };

    app.route('/api/books/:id')
      .get(function (req, res){
        var bookid = req.params.id;
        //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
        getBookInfo(bookid).then(info=>{
          info?res.json(info):res.send('no book exists');
        }).catch(e=>{
          console.log(e);
          res.send('error');
        })
      })

      .post(function(req, res){
        var bookid = req.params.id;
        var comment = req.body.comment;
        //json res format same as .get
        (async (bookid,comment) => {
          let insertRes = await commentCol.insertOne({id:ObjectId(bookid),comment:comment});
          let info = await getBookInfo(bookid);
          res.json(info);
        })(bookid,comment).catch(e=>{
          console.log(e);
          res.send('error');
        });
      })

      .delete(function(req, res){
        var bookid = req.params.id;
        //if successful response will be 'delete successful'
        (async bookid => {
          let id = ObjectId(bookid);
          let delRes = await Promise.all([bookCol.deleteOne({_id:id}),commentCol.deleteMany({id:id})]);
          if (delRes.every(i=>i.result.ok===1)) res.send('delete successful');
          else res.send('error');
        })(bookid).catch(e=>{
          console.log(e);
          res.send('error');
        });
      });
          
    //404 Not Found Middleware
    app.use(function(req, res, next) {
      res.status(404)
        .type('text')
        .send('Not Found');
    });

  });

};
