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
var axios = require('axios');

const CONNECTION_STRING = process.env.DB; //MongoClient.connect(CONNECTION_STRING, function(err, db) {});
const dbname = 'fcc';
const KEY = process.env.API_KEY;

module.exports = function (app) {

  app.route('/api/stock-prices')
    .get(function (req, res){
      (async function(){
        try {
          let stock = req.query.stock;
          let like = req.query.like;
          const r = (stock instanceof Array)?await getInfos(stock.map(i=>i.toUpperCase()),like,req.ip):await getInfo(stock.toUpperCase(),like,req.ip);
          res.json({"stockData":r});        
        } catch (e) {
          console.log(e);
          res.send('error');
        }
      })();
    });
  
  async function getInfo(stock,like,ip) {
    try {
      const stockInfo = await axios.get(`https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${stock}&apikey=${KEY}`);
      const price = stockInfo.data['Global Quote']['05. price'];
      const likes = like?await addLike(stock,ip):await getLikes(stock);
      return {"stock":stock,"price":price,"likes":likes}
    } catch (e) {
      console.log(e)
    }
  }
  
  async function getInfos(stocks,like,ip) {
    try {
      let data = await Promise.all(stocks.map(i=>getInfo(i,like,ip)));
      if (data.length===2) {
        data[0].rel_likes=data[0].likes-data[1].likes;
        data[1].rel_likes=data[1].likes-data[0].likes;
        delete data[0].likes;
        delete data[1].likes;
      }
      return data;
    } catch (e) {
      console.log(e);
    }
  }
  
  async function getLikes(stock) {
    const client = new MongoClient(CONNECTION_STRING,{useNewUrlParser:true});
    try {
      await client.connect();
      const db = client.db(dbname);
      const col = db.collection('stockLikes');
      let info = await col.findOne({stock:stock})
      return info?info.likes:0;
    } catch (e) {
      console.log(e);
    }
    client.close();
  }
  
  async function addLike(stock,ip) {
    const client = new MongoClient(CONNECTION_STRING,{useNewUrlParser:true});
    try {
      await client.connect();
      const db = client.db(dbname);
      const col = db.collection('stockLikes');
      let info = await col.findOne({stock:stock})
      if (info && info.ips.includes(ip)) {
        return info.likes;
      } else {
        let r = await col.findOneAndUpdate({stock:stock},
          {
            $addToSet:{ips:ip},
            $inc:{likes:1}
          },{
            returnOriginal:false,
            upsert:true
          });
        return r.value.likes;
      }
    } catch (e) {
      console.log(e);
    }
    client.close();
  }
  
};
