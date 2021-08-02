const _                       = require('underscore');

const parseIntegerArray = (logHandler, integerArray) => {
    if (integerArray && typeof integerArray == 'string') {
        integerArray = JSON.parse(integerArray);
        integerArray = integerArray.map( val => parseInt(val));
    } else {
        integerArray = integerArray.map( val => parseInt(val));
    }

    return JSON.stringify(integerArray);
}


const stringify = (logHandler, obj) => {

    if (!obj || _.isEmpty(obj))
        return obj;

    if (typeof obj == 'string')
        return obj

    return JSON.stringify(obj);

}

module.exports ={
    parseIntegerArray,
    stringify
}