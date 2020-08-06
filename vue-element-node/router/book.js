const express = require('express')
const multer = require('multer')
const { UPLOAD_PATH } = require('../utils/constant')
const boom = require('boom')
const Result = require('../models/result')
const book = require('../models/book')
const { decoded } = require('../utils')
const Book = require('../models/book')
const bookService = require('../services/book')

const router = express.Router()

console.log(`${UPLOAD_PATH}/book`, 'xxxxxxxxxxxxxxxxxx')

router.post(
        '/upload', 
        multer({ dest: `${UPLOAD_PATH}/book` }).single('file'),
        function (req, res, next) {
            if (!req.file || req.file.length === 0) {
                new Result('上传电子书失败').fail(res)
            } else {
                const Book = new book(req.file)
                Book.parse().then( book => {
                    // console.log('bookxxxxxxxxxxxxxxxxx', book)
                    new Result(book, '上传电子书成功').success(res)
                })
                .catch((err)=> {
                    console.log('upload', err)
                    next(boom.badImplementation(err))
                })
            }
})

router.post(
    '/create',
    function(req, res, next) {
        const decode = decoded(req)
        console.log(decode.username, req.body)
        if (decode && decode.username) {
            req.body.username = decode.username
        }

        const book = new Book(null, req.body)
        // const book = {}  // test
        console.log(book)
        bookService.insetBook(book).then(() => {
            new Result('添加电子书成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })

    }
)

router.post(
    '/update',
    function(req, res, next) {
        const decode = decoded(req)
        console.log(decode.username, req.body)
        if (decode && decode.username) {
            req.body.username = decode.username
        }

        const book = new Book(null, req.body)
        // const book = {}  // test
        console.log(book)
        bookService.updateBook(book).then(() => {
            new Result('更新电子书成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })

    }
)

router.get(
    '/get',
    function(req, res, next) {
        const { fileName } = req.query
        console.log(req.query, 'req.queryreq.queryreq.query')
        if (!fileName) {
            next(boom.badRequest(new Error('参数 fileName 不能为空')))
        } else {
            bookService.getBook(fileName).then( book => {
                new Result(book, '电子书查询成功').success(res)
            }).catch(err => {
                next(boom.badImplementation(err))
            })
        }
    }
)

router.get(
    '/category',
    function(req, res, next) {
        bookService.getCategory(req.query).then( category => {
            new Result(category, '获取分类成功').success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })
    }
)

router.get(
    '/list',
    function(req, res, next) {
        bookService.listBook(req.query).then( ({ list, datelength, page, pageSize }) => {
            // console.log(list, 'listststt')
            new Result({ list }, '获取图书列表成功', {tool: datelength[0]["count"], page: +page, pageSize: +pageSize}).success(res)
        }).catch(err => {
            next(boom.badImplementation(err))
        })
    }
)

router.get(
    '/delete',
    function(req, res, next) {
        const { fileName } = req.query
        console.log(req.query, 'req.queryreq.queryreq.query')
        if (!fileName) {
            next(boom.badRequest(new Error('参数 fileName 不能为空')))
        } else {
            bookService.deleteBook(fileName).then(() => {
                new Result('删除图书信息成功').success(res)
            }).catch(err => {
                next(boom.badImplementation(err))
            })
        }
    }
)

module.exports = router