/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb');
var ObjectId = require('mongodb').ObjectID;

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});

module.exports = function (app) {
  
  MongoClient.connect(CONNECTION_STRING,{useNewUrlParser:true},function(err, mgdb){
    if (err) console.log(err);
    
    const db = mgdb.db('fcc');
    const col = db.collection('issues');
    
    app.route('/api/issues/:project')

      .get(function (req, res){
        var project = req.params.project;
        let queryObj = {...req.query};
        for (let k in queryObj) {
          if (k=='open') {
            queryObj.open = queryObj.open=='true'?true:false;
          }
        }
        col.find({project:project,...queryObj},{'projection':{'project':0}}).toArray().then(d=>res.json(d))
          .catch(e=>console.log(e));
      })
    
      .post(function (req, res){
        var project = req.params.project;
        ['issue_title', 'issue_text', 'created_by'].forEach(i=>{
          if (!req.body[i]) res.send('missing inputs');
        });
        
        let insertObj = {
          project:project,
          issue_title: req.body.issue_title,
          issue_text: req.body.issue_text,
          created_by: req.body.created_by,
          assigned_to: req.body.assigned_to || '',
          status_text: req.body.status_text || '',
          created_on: new Date(),
          updated_on: new Date(),
          open: true
        };
        
        col.insertOne(insertObj)
          .then(result=>{
          result.ops[0].project = undefined;
          res.json(result.ops[0]);
        });
      })

      .put(function (req, res){
        var project = req.params.project;
        
        let updateObj = {...req.body};
        delete updateObj._id;
        for (let k in updateObj) {
          if (!updateObj[k]) delete updateObj[k];
          if (k == 'open') updateObj.open=false;
        }
        if (Object.keys(updateObj).length==0) {
          res.send('no updated field sent');
        } else {
          updateObj.updated_on=new Date();
          col.updateOne({_id:ObjectId(req.body._id),project:project},{$set:updateObj})
            .then(d=>res.send(d.result.ok==1?'successfully updated':'failed'))
            .catch(e=>console.log(e));
        }
      })

      .delete(function (req, res){
        var project = req.params.project;
        if (ObjectId.isValid(req.body._id)) {
          col.deleteOne({_id:ObjectId(req.body._id),project:project})
            .then(d=>res.send(d.result.ok==1?`delete ${req.body._id}`:'failed'))
            .catch(e=>console.log(e));
        } else {
          res.send('_id error')
        }
      });
       
    //404 Not Found Middleware
    app.use(function(req, res, next) {
      console.log('use404');
      res.status(404)
        .type('text')
        .send('Not Found');
    });
    
  });
    
};
