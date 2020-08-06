const db = require('../db')
const Book = require('../models/book')
const _ = require('lodash')


function exists(book) {
    const { title, author, publisher } = book
    const sql = `select * from book where title='${title}' and author='${author}' and publisher='${publisher}'`
    
    return db.queryOne(sql)
}

async function removeBook(book) {
    if (book) {
        book.reset()
        if (book.fileName) {
            const removeBookSql = `delete from book where fileName='${book.fileName}'`
            const removeContentsSq = `delete from contents where fileName='${book.fileName}'`
            await db.deleteOne(removeBookSql)
            await db.deleteOne(removeContentsSq)
        }
    }
}

function insertContents(book) {
    const contents = book.getContents()
    console.log(contents, 'contentscontentscontents')
    if (contents && contents.length > 0) {
        for ( let i = 0; i < contents.length; i++) {
            const content = contents[i]
            const _content = _.pick(content, [
                'fileName',
                'id',
                'href',
                'order',
                'level',
                'text',
                'label',
                'pid',
                'navId'
            ])
            console.log('_content', _content)
            db.insert( _content, 'contents')
        }
    }
}

function insetBook(book) {
    return new Promise( async (resolve, reject) => {
        try {
            if(book instanceof Book) {
                const result = await exists(book)
                if (result) {   // 存在压根就不会insert ，所以removBook有点多余
                    removeBook(book)
                    reject(new Error('电子书已存在'))
                } else {
                    await db.insert(book.toDb(), 'book')
                    await insertContents(book)
                    resolve()
                }
            } else {
                reject(new Error('添加的图书对象不合法'))
            }
        } catch (e) {
            reject(e)
        }
    })
}

function updateBook(book) {
    return new Promise( async (resolve, reject) => {
        try {
            if(book instanceof Book) {
                const result = await getBook(book.fileName)
                console.log(result, 'resultresultresult')
                if (result) {   // 存在压根就不会insert ，所以removBook有点多余
                    const model = book.toDb()
                    if(+result.updataType === 0) {
                        reject(new Error('内置图书无法编辑'))
                    } else {
                        await db.updata(model, 'book', `where fileName='${book.fileName}'`)
                        resolve()
                    }
                }
            } else {
                reject(new Error('更新的图书对象不合法'))
            }
        } catch (e) {
            reject(e)
        }
    })
}

function getBook(fileName) {
    return new Promise( async (resolve, reject) => {
        const bookSql = `select * from book where fileName='${fileName}'`
        const contentsSql = `select * from contents where fileName='${fileName}' order by \`order\``
        const book = await db.queryOne(bookSql)
        const contents = await db.querySql(contentsSql)
        if (book) {
            book.cover = Book.getCoverUrl(book)
            book.contentsTree = Book.getContentsTree(contents)
            resolve(book)
        } else {
            reject(new Error('电子书不存在'))
        }

        
    }) 
    
}

function deleteBook(fileName) {
    return new Promise( async (resolve, reject) => {
        let book = await getBook(fileName)
        if(book){
            // const book = await db.queryOne(deleteBookSql)
            if(+book.updateType === 0) {
                reject(new Error('内置图书无法删除'))
            } else {
                const bookObj = new Book(null, book)
                const sql = `delete from book where fileName='${fileName}'`
                db.querySql(sql).then(()=>{
                    bookObj.reset()
                    resolve()
                })
            }
        } else {
            reject(new Error('电子书不存在'))
        }
        
         
      
        
    }) 
}

async function getCategory(query) {
        const {  
            title, 
            author
        } = query

        const sql = 'select * from category order by category asc'
        let cbe = `select \`book\`.\`categoryText\` AS \`categoryText\`,count(0) AS \`num\` from \`book\` `
        let where = 'where'
        title && (where = db.andLike(where, 'title', title))
        author && (where = db.andLike(where, 'author', author))
        if(where !== 'where') {
            cbe = `${cbe} ${where}`
        }
        cbe = `${cbe} group by \`book\`.\`categoryText\``

        console.log(cbe, 'cbecbecbecbe')
        // where book.title like '%ae%'  group by \`book\`.\`categoryText\`
        const cb = await db.querySql(cbe)
        const result = await db.querySql(sql)
        let categoryList = []
        cb.forEach(item => {
            categoryList.push({
                label: item.category,
                value: item.categoryText,
                num: item.num
            })   
        })

        return categoryList
}

async function listBook(query) {   
        console.log(query, 'query')
        const { 
                category, 
                title, 
                author, 
                page = 1, 
                pageSize = 20,
                sort
            } = query
        const offset = (page - 1) * pageSize
        let booksql = 'select * from book'
        let toolength = 'select count(*) as count from book'
        let where = `where`
        title && (where = db.andLike(where, 'title', title))
        author && (where = db.andLike(where, 'author', author))
        category && (where = db.and(where, 'categoryText', category))
        if(where !== 'where') {
            booksql = `${booksql} ${where}`
        }
        if(sort) {
            const symbol = sort[0]
            const column = sort.slice(1, sort.length)
            const order = symbol === '+'? 'asc': 'desc'
            booksql = `${booksql} order by \`${column}\` ${order}`
        }
        if(where !== 'where') {
            toolength = `${toolength} ${where}`
        }

        const bookSpecies = booksql

        booksql = `${booksql} limit ${pageSize} offset ${offset}`
        
        // console.log(booksql,query,toolength, 'zxzxzxzxzx')
        const list = await db.querySql(booksql)
        const datelength = await db.querySql(toolength)
        list.forEach(book => book.cover = Book.getCoverUrl(book))
        // let obje = {}
        // for(var i=0;i<Speciessql.length;i++) {
        //     var value = Speciessql[i].categoryText
        //     if(obje.hasOwnProperty(value)){
        //         obje[value] += 1
        //     } else {
        //         obje[value] = 1
        //     }    
        // }
        // console.log(obje)

        return { list, datelength, page, pageSize }
}

module.exports = {
    insetBook,
    getBook,
    deleteBook,
    updateBook,
    getCategory,
    listBook
}