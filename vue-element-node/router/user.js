const express = require('express')
const { login, findUser } = require('../services/user')
const Result = require('../models/result')
const { md5, decoded } = require('../utils')
const { PWD_SALT, PRTVATE_KEY, JWT_EXRIRED } = require('../utils/constant')
const { body, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')


const router = express.Router()

var adc = {
            "user_router": 
                [
                    {
                        "component": "/book/a", 
                        "icon": "form", 
                        "id": 14, 
                        "name": "dash", 
                        "path": "/book/a", 
                        "title": "\u9996\u9875", 
                        "uid": 5
                    }, 
                    {
                        "component": "/book/b", 
                        "icon": "form", 
                        "id": 15, 
                        "name": "alipay", 
                        "path": "/book/b", 
                        "title": "\u652f\u4ed8\u5b9d", 
                        "uid": 5
                    }
                ]
        }


router.get('/info', function(req, res) {
    // let { username } = res
    const decode = decoded(req)
    console.log(decode, 'decodedecodedecodedecode')
    if (decode && decode.username) {
        findUser(decode.username).then(user => {
            console.log(user)
            if (user) {
                user.roles = user.role
                user = Object.assign(user, adc)
                new Result(user, '用户信息查询成功').success(res)
            } else {
                new Result('用户信息查询失败').fail(res)
            }
        })
    } else {
        new Result('用户信息查询失败').fail(res)
    }


    
})

router.post(
    '/login',
    [
        body('username').isString().withMessage('用户名必须为字符'),
        body('password').isString().withMessage('用户名必须为字符')
    ], 
function( req, res, next) {
    const err = validationResult(req)
    if(!err.isEmpty()){
        const [{msg}] = err.errors
        next(boom.badRequest(msg))
    } else {
        let { username, password } = req.body
        console.log(username, md5(`${password}${PWD_SALT}`))
        password = md5(`${password}${PWD_SALT}`)
    
        login(username, password).then( user => {
           
            if(!user || user.length === 0) {
                new Result('登录失败').fail(res)
            } else{
                const token = jwt.sign(
                    { username },
                    PRTVATE_KEY,
                    { expiresIn: JWT_EXRIRED}
                )

                new Result({ token },'登录成功').success(res)
            }
        })
    }

    
})

module.exports = router