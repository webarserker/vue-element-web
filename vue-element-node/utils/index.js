const crypto = require('crypto')
const jwt = require('jsonwebtoken')
const { PRTVATE_KEY } = require('./constant')

function md5(s) {
    // 注意参数类型需要为 String 类型，否则会出错
    return crypto.createHash('md5').update(String(s)).digest('hex')
}

function decoded(req) {
    let token = req.get('Authorization')
    console.log(token, 'tokentoken')
    if (token.indexOf('Bearer') === 0) {
        token = token.replace('Bearer', '').trim()
    }
    return jwt.verify(token, PRTVATE_KEY)
}

function isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]'
}

function isEmpty(obj){
    if(typeof obj == "undefined" || obj == null || obj == ""){
        return true;
    }else{
        return false;
    }
}

module.exports = {
    md5,
    decoded,
    isObject,
    isEmpty
}