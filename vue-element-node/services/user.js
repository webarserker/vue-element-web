const { querySql, queryOne } = require('../db')

function login (username, password) {
    console.log(username, password, 'username, password')
    return querySql(`SELECT * from admin_user where username='${username}' and password='${password}'`)
}

function findUser(username) {
    return queryOne(`SELECT id, username, nickname, role, avatar from admin_user where username='${username}'`)
}

module.exports = {
    login,
    findUser
}