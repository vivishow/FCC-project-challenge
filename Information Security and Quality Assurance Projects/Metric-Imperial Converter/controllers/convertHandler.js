/*
*
*
*       Complete the handler logic below
*       
*       
*/

function ConvertHandler() {
  
  this.getNum = function(input) {
    var result = input.match(/(.*?)([A-z]+)/);
    if (!result) return false;
    if (!result[1]) {
      return 1;
    } else if (/[^\d\.\/]/.test(result[1])) {
      return false;
    } else {
      var resArr = result[1].split('/').map(i=>Number(i));
      if (resArr.length === 1) {
        return resArr[0]?resArr[0]:false;
      } else if (resArr.length === 2 && resArr[0] && resArr[1] ) {
        return resArr[0]/resArr[1];
      } else {
        return false;
      }
    }
  };
  
  this.getUnit = function(input) {
    var result = input.match(/(.*?)([A-z]+)/);
    if (!result) return false;
    result = result[2];
    var unitList = ['gal','l','mi','km','lbs','kg','GAL','L','MI','KM','LBS','KG'];
    
    return unitList.includes(result)?result:false;
  };
  
  this.getReturnUnit = function(initUnit) {
    var units = {gal:'l',l:'gal',lbs:'kg',kg:'lbs',mi:'km',km:'mi'};
    
    return initUnit?units[initUnit.toLowerCase()]:false;
  };

  this.spellOutUnit = function(unit) {
    var result = {gal:'gallons',l:'liters',lbs:'pounds',kg:'kilograms',mi:'miles',km:'kilometers'};
    
    return unit?result[unit.toLowerCase()]:false;
  };
  
  this.convert = function(initNum, initUnit) {
    if (!(initNum && initUnit)) return false;
    const galToL = 3.78541;
    const lbsToKg = 0.453592;
    const miToKm = 1.60934;
    
    var result;
    
    switch (initUnit.toLowerCase()) {
      case 'gal':
        result = initNum * galToL;
        break;
      case 'l':
        result = initNum / galToL;
        break;
      case 'lbs':
        result = initNum * lbsToKg;
        break;
      case 'kg':
        result = initNum / lbsToKg;
        break;
      case 'mi':
        result = initNum * miToKm;
        break;
      case 'km':
        result = initNum / miToKm;
        break;
      default:
        return false;
    }
    
    return Number((Math.round(result*100000)/100000).toFixed(5));
    
  };
  
  this.getString = function(initNum, initUnit, returnNum, returnUnit) {
    
    var result = `${initNum} ${this.spellOutUnit(initUnit)} converts to ${returnNum} ${this.spellOutUnit(returnUnit)}`;
    
    return result;
  };
  
}

module.exports = ConvertHandler;
