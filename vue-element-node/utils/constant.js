// const { env } = require('./env')
// const UPLOAD_PATH = env === 'dev' ? 'C:\Users\pc\Desktop\epub\admin_upload_ebook\book' : '/root/upload/admin_upload_ebook\book'

const UPLOAD_PATH = 'C:/Users/pc/Desktop/epub/admin_upload_ebook'

// const UPLOAD_URL = env === 'dev' ? 'https://luxingxing.xyz/admin_upload_ebook/book' : 'https://luxingxing.xyz/admin_upload_ebook/book'

const UPLOAD_URL = 'https://luxingxing.xyz/admin_upload_ebook'

const OLD_UPLOAD_URL = 'https://luxingxing.xyz/old_ebook'

module.exports = {
    CODE_ERROR: -1,
    CODE_SUCCESS: 20000,
    CODE_TOKEN_EXPIRED: 50008,
    debug: true,
    PWD_SALT: 'admin_imooc_node',
    PRTVATE_KEY: 'admin_aliyun_test_luxingxing_xyz',
    JWT_EXRIRED: 60 * 60,
    UPLOAD_PATH,
    UPLOAD_URL,
    OLD_UPLOAD_URL,
    MIME_TYPE_EPUB: "application/epub+zip"
}