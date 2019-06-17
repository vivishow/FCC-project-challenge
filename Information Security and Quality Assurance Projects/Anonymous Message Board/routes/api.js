/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;
const MongoClient = require('mongodb').MongoClient;
const ObjectId = require('mongodb').ObjectId;
const DB_URI = process.env.DB;
const dbname = 'fcc';

module.exports = function (app) {
  
  app.route('/api/threads/:board')
  .get(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let r = await col.find({...req.params}).toArray();
      r.forEach(i=>{
        i.replycount=i.replies.length;
        delete i.reported;
        delete i.delete_password;
        delete i.board;
        i.replies = i.replies.slice(-3);
      });
      res.json(r);
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  })
  .post(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let time = new Date();
      let r = await col.insertOne({...req.body,...req.params,created_on:time,bumped_on:time,replies:[],reported:false})
      res.redirect(`/b/${req.params.board}/`);
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  })
  .put(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      const id = ObjectId(req.body.report_id);
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let r = await col.findOneAndUpdate({_id:id},{$set:{reported:true}});
      r.ok===1?res.send('reported'):res.send('error');
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  })
  .delete(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      const id = ObjectId(req.body.thread_id);
      const passw = req.body.delete_password;
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let r = await col.findOne({_id:id})
      if (r.delete_password===passw) {
        col.deleteOne({_id:id}).then(d=>{
          res.send(d.result.ok===1?'success':'error');
        });
      } else {
        res.send('incorrect password');
      }
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  });
    
  app.route('/api/replies/:board')
  .get(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      const id = ObjectId(req.query.thread_id);
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let r = await col.findOne({_id:id});
      for (let reply of r.replies) {
        delete reply.delete_password;
        delete reply.reported;
      }
      res.json({...r,board:undefined,delete_password:undefined,reported:undefined});
    } catch (e) {
      console.log(e);
      res.send('error');
    }
  })
  .post(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      const id = ObjectId(req.body.thread_id);
      const time = new Date();
      const reply = {
        _id:ObjectId(),
        text:req.body.text,
        created_on:time,
        delete_password:req.body.delete_password,
        reported:false
      }
      await client.connect();
      const col = client.db(dbname).collection('messages');
      let r = await col.findOneAndUpdate({_id:id},{
        $push:{replies:reply},
        $set:{bumped_on:time}
      },{
        returnOriginal:false
      });
      r.ok===1?res.redirect(`/b/${req.params.board}/${req.body.thread_id}`):res.send('error');
    } catch (e) {
      console.log(e);
      res.send('error');
    }
  })
  .put(async function(req,res){
    const client = new MongoClient(DB_URI, {useNewUrlParser:true});
    try {
      await client.connect();
      const id = ObjectId(req.body.thread_id);
      const rId = ObjectId(req.body.reply_id);
      const col = client.db(dbname).collection('messages');
      let r = await col.findOneAndUpdate({_id:id,'replies._id':rId},{
        $set:{'replies.$.reported':true}
      },{returnOriginal:false});
      r.ok===1?res.send('reported'):res.send('error');
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  })
  .delete(async function(req,res){
    const client = new MongoClient(DB_URI,{useNewUrlParser:true});
    try {
      await client.connect();
      const col = client.db(dbname).collection('messages');
      const id = ObjectId(req.body.thread_id);
      const rId = ObjectId(req.body.reply_id);
      const passwd = req.body.delete_password;
      let r = await col.findOne({_id:id,'replies._id':rId},{projection:{'replies.$':1}});
      if (r.replies[0].delete_password===passwd) {
        col.findOneAndUpdate({_id:id,'replies._id':rId},{
          $set:{'replies.$.text':'[deleted]'}
        }).then(d=>{
          res.send(d.ok===1?'success':'error');
        });
      } else {
        res.send('incorrect password');
      }
    } catch (e) {
      console.log(e);
      res.send('error');
    }
    client.close();
  });

};
