const mysql = require('mysql')
const config = require('./config')
const { debug } = require('../utils/constant')
const { isObject } = require('../utils')

function connect() {
    return mysql.createConnection({
        host: config.host,
        user: config.user,
        password: config.password,
        database: config.database,
        multipleStatements: true
    })
}

function querySql(sql) {
    const conn = connect()  
    debug && console.log(sql)
    return new Promise((resolve, reject) => {
        try {
            conn.query(sql, (err, results) => {
                if(err) {
                    debug && console.log('查询失败，原因' + JSON.stringify(err))
                    reject(err)
                } else {
                    debug && console.log('查询成功' + JSON.stringify(results))
                    resolve(results)
                }
            })
        } catch (e) {
            reject(e)
        } finally {
            conn.end()
        }
    })
}

function queryOne(sql) {
    return new Promise( (resolve, reject) => {
        querySql(sql).then( results => {
            if (results && results.length > 0) {
                resolve(results[0])
            } else {
                resolve(null)
            }
        }).catch( err => {
            reject(err)
        })
    })
}

function insert(module, tableName) {
    return new Promise((reslove, reject) => {
        if (!isObject(module)){
            reject(new Error('插入数据库失败， 插入数据非对象'))
        } else {
            const keys = []
            const values = []
            // delete module.path
            Object.keys(module).forEach(key => {
                if (module.hasOwnProperty(key)) {
                    keys.push(`\`${key}\``)
                    values.push(`'${module[key]}'`)
                }
            })
            if (keys.length > 0 && values.length > 0) {
                let sql = `INSERT INTO \`${tableName}\`(`
                const keysString = keys.join(',')
                const valuesSting = values.join(',')
                sql = `${sql}${keysString}) VALUES (${valuesSting})`
                debug && console.log(sql)
                const conn = connect()
                try {
                    conn.query(sql, (err, result) => {
                        if (err ) {
                            reject(err)
                        } else {
                            reslove(result)
                        }
                    })
                } catch (e) {
                    reject(e)
                } finally {
                    conn.end()
                }
            } else {
                reject(new Error('插入数据库失败，对象中没有属性'))
            }
        }
    })
}

function updata(module, tableName, where) {
    return new Promise((reslove, reject) => {
        if (!isObject(module)){
            reject(new Error('插入数据库失败， 插入数据非对象'))
        } else {
            const data = []
            // delete module.path
            Object.keys(module).forEach(key => {
                if (module.hasOwnProperty(key)) {
                    data.push(`\`${key}\`='${module[key]}'`)
                }
            })
            console.log(data, 'datadatadata')
            if (data.length > 0) {
                // `UPDATE ${tableName} set fileName=${tableName} ${where}`
                let sql = `UPDATE \`${tableName}\``
                const keysString = data.join(',')
                sql = `${sql} set ${keysString} ${where}`
                debug && console.log(sql)
                const conn = connect()
                try {
                    conn.query(sql, (err, result) => {
                        if (err ) {
                            reject(err)
                        } else {
                            reslove(result)
                        }
                    })
                } catch (e) {
                    reject(e)
                } finally {
                    conn.end()
                }
            } else {
                reject(new Error('插入数据库失败，对象中没有属性'))
            }
        }
    })
}

function deleteOne(sql) {
    debug && console.log(sql)
    const conn = connect()
    return new Promise((resolve, reject) => {
        try {
            conn.query(sql, (err, results) => {
                if(err) {
                    debug && console.log('删除失败' + JSON.stringify(err))
                    reject(err)
                } else {
                    debug && console.log('删除成功' + JSON.stringify(results))
                    resolve(results)
                }
            })
        } catch (e) {
            reject(e)
        } finally {
            conn.end()
        }
    })
}

function and(where, fieldName, fieldValues) {
    if(where === 'where') {
        return `${where} \`${fieldName}\`='${fieldValues}'`
    } else {
        return `${where} and \`${fieldName}\`='${fieldValues}'`
    }
    
}

function andLike(where, fieldName, fieldValues) {
    if(where === 'where') {
        return `${where} \`${fieldName}\` like '%${fieldValues}%'`
    } else {
        return `${where} and \`${fieldName}\` like '%${fieldValues}%'`
    }
    
}


module.exports = {
        querySql, 
        queryOne,
        insert,
        deleteOne,
        updata,
        and,
        andLike
    }

     