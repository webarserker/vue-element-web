const expressJwt = require('express-jwt')
const { PRTVATE_KEY } = require('../utils/constant')

const jwtAuth = expressJwt({
    secret: PRTVATE_KEY,
    algorithms: ['HS256'],
    credentialsRequired: true // false 游客也能访问
}).unless({
    path: [
        '/',
        '/user/login'
    ] // jwt白名单
})

module.exports = jwtAuth