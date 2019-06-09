/*
*
*
*       Complete the API routing below
*
*
*/

'use strict';

var expect = require('chai').expect;

module.exports = function (app) {
  
  app.route('/api/convert')
    .get(function (req, res){
      var input = req.query.input;
      if (!input) {
        res.send('invalid number and unit');
      } else {
        var initNum = convertHandler.getNum(input);
        var initUnit = convertHandler.getUnit(input);
        if (!initNum && !initUnit) {
          res.send('invalid number and unit');
        } else if (!initNum) {
          res.send('invalid number');
        } else if (!initUnit) {
          res.send('invalid unit');
        } else {
          var returnNum = convertHandler.convert(initNum, initUnit);
          var returnUnit = convertHandler.getReturnUnit(initUnit);
          var toString = convertHandler.getString(initNum, initUnit, returnNum, returnUnit);

          var result = {
            initNum: initNum,
            initUnit: initUnit,
            returnNum: returnNum,
            returnUnit: returnUnit,
            string: toString
          };
          res.json(result);
        }
      }
    });
    
};
