const {
    MIME_TYPE_EPUB,
    UPLOAD_URL,
    UPLOAD_PATH,
    OLD_UPLOAD_URL
  } = require('../utils/constant')

const fs = require('fs')
const Epub = require('../utils/epub')
const path = require('path')
const Result = require('../models/result')

const xml2js = require('xml2js').parseString

class Book {

    constructor(file, data) {
        if (file) {
            this.createBookFromFile(file)
        } else {
            this.createBookFromData(data)
        }
    }

    
    createBookFromFile(file) {
        // console.log(UPLOAD_URL, 'UPLOAD_URLUPLOAD_URL')
        const {
            destination,
            filename,
            mimetype = MIME_TYPE_EPUB,
            path,
            originalname
        } = file
       
        // 电子书的后缀名
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        // 电子书的原有路径
        const oldBookPath = path
        // 电子书的新路径
        const bookPath = `${destination}/${filename}${suffix}`
        // 电子书的下载URL
        const url = `${UPLOAD_URL}/book/${filename}${suffix}`
        // 电子书的解压后的文件夹路径
        const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
        // 电子书的解压后的文件夹URL
        const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`

        if( !fs.existsSync(unzipPath) ) {
            fs.mkdirSync(unzipPath, {recursive: true})
        }

        if( fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)) {
            fs.renameSync(oldBookPath, bookPath)
        }

        // console.log(file,filename, 'BookBookBookBookBook')

        this.fileName = filename // 文件名，没有后缀
        this.path = `/book/${filename}${suffix}` // epub文件相对路径，因为服务端的路径可能不一致
        this.filePath = this.path
        this.unzipPath = `/unzip/${filename}` // epub解压后的相对路径
        this.url = url
        this.title = '' // 电子书标题书名
        this.author = '' //电子书作者
        this.publisher = '' // 出版社
        this.contents = [] // 目录
        this.contentsTree = [] // 符合饿了么UIffrom的数据结构树
        this.cover = '' // 封面图片URL
        this.coverPath = '' // 封面图片路径
        this.category = -1 // 分类ID
        this.categoryText = '' // 分类名称
        this.language = '' // 语音
        this.unzipUrl = unzipUrl // 解压后的文件夹链接
        this.originalName = originalname

    }

    createBookFromData(data) {
        this.fileName = data.fileName
        this.cover = data.cover
        this.title = data.title
        this.author = data.author
        this.publisher = data.publisher
        this.bookId = data.fileName
        this.language = data.language
        this.rootFile = data.rootFile
        this.originalName = data.originalName
        this.path = data.path || data.filePath
        this.filePath = data.path || data.filePath
        this.unzipPath = data.unzipPath
        this.coverPath = data.coverPath
        this.createUser = data.username
        this.createDt = new Date().getTime()
        this.updateDt = new Date().getTime()
        this.updateType = data.updateType === 0 ? data.updateType : 1
        this.category = data.category || 99
        this.categoryText = data.categoryText || '自定义'
        this.contents = data.contents || []
    }

    parse() {
        return new Promise(( resolve, reject) => {
            const bookPath = `${UPLOAD_PATH}${this.filePath}`
            if (!fs.existsSync(bookPath)) {
                reject(new Error('电子书不存在'))
            }
            // console.log(bookPath, 'bookPathbookPathbookPathbookPath')
            const epub = new Epub(bookPath)
            epub.on('error', err => {
                reject(err)
            })

            epub.on('end', err => {
                if(err) {
                    reject(err)
                } else {
                    // console.log('epubepubepubepubepub', epub.manifest)
                    const { 
                        language,
                        creator,
                        creatorFileAs,
                        title,
                        cover,
                        publisher
                    } = epub.metadata

                    // console.log(epub.metadata, 'errrrrrerrrrrrerrrrrr')
                    if (!title) {
                        reject(new Error('图书标题为空'))
                    } else {
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'Unknown'
                        this.publisher = publisher || 'Unknown'
                        this.rootFile = epub.rootFile
                        const handleGetImage = (err, file, mimetype) => {
                        // console.log(err, file, mimetype, 'err, file, mimetypeerr, file, mimetype')
                            if (err) {
                                reject(err)
                            } else {
                                const suffix = mimetype.split('/')[1]
                                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                                fs.writeFileSync(coverPath, file, 'binary')
                                this.coverPath = `/img/${this.fileName}.${suffix}`
                                this.cover = coverUrl
                                console.log(this.cover, 'this.coverthis.coverthis.cover')
                                resolve(this)
                            }
                        }
                        try {
                            this.unzip()
                            this.parseContents(epub).then(({chapters, chapterTree})=>{
                                // console.log(chapters, 'chapterschapterschapterschapters')
                                this.contents = chapters
                                this.contentsTree = chapterTree
                                // console.log(cover,'cover..............')
                                epub.getImage(cover, handleGetImage)
                            })
                        } catch(e) {
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
            
        })
        
    }

    unzip() {
        const AdmZip = require('adm-zip')
        // console.log(this.unzipPath, Book.genPath(this.path),this.path, 'this.paththis.paththis.path')
        const zip = new AdmZip(Book.genPath(this.path))
        zip.extractAllTo(Book.genPath(this.unzipPath), true)
    }

    parseContents(epub){
        function getNcxFilePath() {
            const spine = epub && epub.spine
            const manifest = epub && epub.manifest
            const ncx =spine.toc && spine.toc.href
            const id = spine.toc && spine.toc.id

            // console.log(ncx,id,manifest[id].href, 'spinespinespine')
            if(ncx) {
                return ncx
            } else {
                return manifest[id].href
            }
        }

        function findParebt(array, level = 0, pid = '') {
            return array.map(item => {
                item.level = level
                item.pid = pid
                if (item.navPoint && item.navPoint.length > 0) {
                    item.navPoint = findParebt(item.navPoint, level + 1, item['$'].id)
                } else if (item.navPoint) {
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }
                
                return item
            })
        }

        function flatten(array) {
            return [].concat(...array.map(item => {
                if (item.navPoint && item.navPoint.length > 0) {
                    return [].concat(item, ...flatten(item.navPoint))
                } else if (item.navPoint) {
                    return [].concat(item, item.navPoint)                
                }
                return item
            }))
        }


        const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`) 
        // console.log(ncxFilePath, 'ncxFilePathncxFilePathncxFilePath')
        if (fs.existsSync(ncxFilePath)) {
            return new Promise((resolve, reject)=> {
                // console.log(ncxFilePath, 'ncxFilePathncxFilePath')
                const xml = fs.readFileSync(ncxFilePath, 'utf-8')
                const dir = path.dirname(ncxFilePath).replace(UPLOAD_PATH, '')
                // console.log(dir, 'dirdirdirdir')
                const fileName = this.fileName
                xml2js(xml, {
                    explicitArray: false,
                    ignoreAttrs: false
                }, (err, json) => {
                    if(err) {
                        reject(err)
                    } else {
                        const navMap = json.ncx.navMap
                        // console.log('xml', JSON.stringify(navMap))
                        if (navMap.navPoint && navMap.navPoint.length > 0) {
                           
                            navMap.navPoint = findParebt(navMap.navPoint)
                            // console.log(navMap.navPoint, 'navMap.navPointnavMap.navPoint')
                            const newNavMap = flatten(navMap.navPoint)
                            // b(navMap.navPoint)
                            const chapters = []
                            // console.log(newNavMap, epub.flow, 'epub.flowepub.flowepub.flow')
                            newNavMap.forEach((chapter, index) => {
                                console.log(newNavMap[index].content['$'], 'apix$')
                                const nav = newNavMap[index]
                                const src = nav.content['$'].src
                                chapter.id = `${src}`
                                chapter.text = `${UPLOAD_URL}${dir}/${src}`
                                // console.log(chapter.text)
                                chapter.href = `${dir}/${src}`.replace(this.unzipPath, '')
                                chapter.label = chapter.navLabel.text || ''
                                chapter.navId = nav['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                chapters.push(chapter)
                            });
                            // console.log(chapters, 'chapterschapterschapters')
                            // const chapterTree = []
                            // chapters.forEach(c => {
                            //     c.children = []
                            //     if(c.pid === ''){
                            //         chapterTree.push(c)
                            //     } else {
                            //         const parent = chapters.find( _ => _.navId === c.pid )
                            //         parent.children.push(c)
                            //     }
                            // })
                            Book.getContentsTree(chapters)
                            // console.log(chapterTree, 'chapterTreechapterTreechapterTree')
                            resolve({ chapters, chapterTree: Book.getContentsTree(chapters) })
                        } else {
                            reject(new Error('目录解析失败，目录树为0'))
                        }
                    }
                })
            })
        } else {
            throw new Error('目录对应的ncx资源文件不存在')
        }
    }

    toDb() {
        return {
            fileName: this.fileName,
            cover: this.cover,
            title: this.title,
            author: this.author,
            publisher: this.publisher,
            bookId: this.fileName,
            language: this.language,
            rootFile: this.rootFile,
            originalName: this.originalName,
            filePath: this.filePath,
            unzipPath: this.unzipPath,
            coverPath: this.coverPath,
            createUser: this.createUser,
            createDt: this.createDt,
            updateDt: this.updateDt,
            updateType: this.updateType,
            category: this.category,
            categoryText: this.categoryText
        }
    }

    getContents() {
        return this.contents
    }

    reset() {
        if (Book.pathExists(this.filePath)) {
            console.log('删除文件')
            fs.unlinkSync(Book.genPath(this.filePath))
        }
        if (Book.pathExists(this.coverPath)) {
            console.log('删除封面')
            fs.unlinkSync(Book.genPath(this.coverPath))
        }
        if (Book.pathExists(this.unzipPath)) {
            console.log('删除解压文件')
            fs.rmdirSync(Book.genPath(this.unzipPath), {recursive: true})
        }
    }

    static isAbsoluteURL(url) { 
        return /^([a-z][a-z\d\+\-\.]*:)?\/\//i.test(url);   // 判断是否是URL地址
      }

    static genPath(path) {
        if (!path.startsWith('/')) {
            path = `/${path}`
        } 
        return `${UPLOAD_PATH}${path}`
    }

    static pathExists(path) {
        if (path.startsWith(UPLOAD_PATH)) {
            return fs.existsSync(path)
        } else {
            return fs.existsSync(Book.genPath(path))
        }
    }

    static getOneFile=function(dir, target){    // 遍历文件夹查找目标文件的绝对路径
        let res=[]
        try {
            function traverse(dir){
                fs.readdirSync(dir).forEach((file)=>{
                    const pathname=path.join(dir,file)
                    if(fs.statSync(pathname).isDirectory()){
                        traverse(pathname)
                    }else if(pathname.includes(target)) {
                            res.push(pathname.replace(/\\/g,"/"))
                        }
                })
        }
                traverse(dir)
        // console.log(dir.replace(new RegExp(["'\s>],"gm"), '\'))
                return res[0].replace(dir, '');
            } catch (e) {
                new Result('目录对应的ncx资源文件不存在')
        }
    }


    static getCoverUrl(book) {
        const { fileName, cover } = book
        if(+book.updateType === 0){
            // console.log(fileName, rootFile, cover, `${OLD_UPLOAD_URL}/${fileName}/${rootFile.split('/')[0]}/images/${cover.split('/')[1]}`, 'fileName, rootFile, cover')
            // https://luxingxing.xyz/old_ebook/2018_Book_Nanoinformatics/OEBPS/images/978-981-10-7617-6_CoverFigure.jpg
            
            // path.dirname(ncxFilePath)

            if (cover){
                const old_ebook = `C:/Users/pc/Desktop/epub/old_ebook/${fileName}`
                const onfile = Book.getOneFile(old_ebook, cover.split('/')[2])

                if (cover.startsWith('/')) {
                    return `${OLD_UPLOAD_URL}/${fileName}${onfile}`
                } else {
                    return `${OLD_UPLOAD_URL}/${fileName}/${onfile}`
                }
            } else {
                return null
            }
        } else {
            if (cover){
                if(!Book.isAbsoluteURL(cover)) {
                    if (cover.startsWith('/')) {
                        return `${UPLOAD_URL}${cover}`
                    } else {
                        return `${UPLOAD_URL}/${cover}`
                    }
                }  
                    return `${cover}`
               
                
            } else {
                return null
            }
        }
    }

    static getContentsTree(contents) {
        if( contents ) {
            const contentsTree = []
            contents.forEach(c => {
                c.children = []
                if(c.pid === ''){
                    contentsTree.push(c)
                } else {
                    const parent = contents.find( _ => _.navId === c.pid )
                    parent.children.push(c)
                }
            })
            return contentsTree
        }
    }
}

module.exports = Book
