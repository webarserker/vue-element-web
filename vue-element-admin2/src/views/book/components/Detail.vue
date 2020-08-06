<template>
  <el-form ref="postForm" :model="postForm" :rules="rules" >
    <sticky :sticky-top="84" :class-name="'sub-navbar ' + postForm.status">
      <el-button v-if="!isEdit" @click="showGuide">显示帮助</el-button>
      <el-button
        v-loading="loading"
        type="success"
        @click="submitFrom"
      >
        {{ isEdit ? '编辑电子书' : '新建电子书' }}
      </el-button>
    </sticky>
    <div class="detail-container">
      <el-row>
        <warning />
        <el-col :span="24">
          <!-- 表单控件的具体样式 -->
          <EbookUpload 
            :file-list="fileList"
            :disabled="isEdit"
            @onSuccess="onUploadsuccess"
            @onRemove="onUploadeRemove"
        />
        </el-col>
        <el-col :span="24">
            <el-form-item prop="title" >
                <MDInput
                    v-model="postForm.title"
                    :maxlength="100"
                    name="name"
                    required
                >
                书名
                </MDInput>
            </el-form-item>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="作者" prop="author" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.author"
                            placeholder="作者"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="出版社" prop="publisher" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.publisher"
                            placeholder="出版社"
                        />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="语言" prop="language" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.language"
                            placeholder="语言"
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="根文件" prop="rootFile" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.rootFile"
                            placeholder="根文件"
                            disabled
                        />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="文件路径" prop="filePath" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.filePath"
                            placeholder="文件路径"
                            disabled
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="解压路径" prop="unzipPath" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.unzipPath"
                            placeholder="解压路径"
                            disabled
                        />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="12">
                    <el-form-item label="封面路径：" prop="coverPath" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.coverPath"
                            placeholder="封面路径"
                            disabled
                        />
                    </el-form-item>
                </el-col>
                <el-col :span="12">
                    <el-form-item label="文件名称" prop="originalName" :label-width="labelWidth">
                        <el-input
                            v-model="postForm.originalName"
                            placeholder="文件名称"
                            disabled
                        />
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="24">
                    <el-form-item label="封面:" prop="cover" label-width="60px">
                        <a v-if="postForm.cover" :href="postForm.cover" target="_blank">
                            <img :src="postForm.cover" class="preview-img" />
                        </a>    
                        <span v-else>无</span>
                    </el-form-item>
                </el-col>
            </el-row>
            <el-row>
                <el-col :span="24">
                    <el-form-item label="目录:" prop="contentsTree" label-width="60px" >
                        <div v-if="postForm.contentsTree && postForm.contentsTree.length > 0" class="contents-wrapper">
                            <el-tree :data="contentsTree" @node-click="onContentClick" />
                        </div>  
                        <span v-else>无</span>
                    </el-form-item>
                </el-col>
                
            </el-row>
        </el-col>
      </el-row>
    </div>
  </el-form>
</template>

<script>
import Sticky from '../../../components/Sticky'
import Warning from './Warning'
import EbookUpload from '../../../components/EbookUpload'
import MDInput from '../../../components/MDinput/index'
import {createBook, updateBook, getBook } from '../../../api/book'


const defaultForm = {
                        title: '',
                        author: '',
                        publisher: '',
                        language: '',
                        rootFile: '',
                        cover: '',
                        coverPath: '',
                        url: '',
                        unzipUrl: '',
                        originalName: '',
                        fileName: '',
                        filePath: '',
                        contents: '',
                        contentsTree: '',
                        unzipPath: ''
                    }

const fields = {    //错误映射
    title: '标题',
    author: '作者',
    publisher: '出版社',
    language: "语言"
}

export default {
    components: {
        Sticky,
        Warning,
        EbookUpload,
        MDInput
    },
    props: {
        isEdit: Boolean
    },
    data() {
        const validateRequire = (rule, value, callback) => {
            console.log(rule, value)
            if (value.length === 0) {
                callback(new Error(fields[rule.field] + '必须填写'))
            } else {
                callback()
            }
        }

        return {
            loading: false,
            postForm: {
                    title: '',  // vue-admin 的坑，必须给默认值
                    author: '',
                    publisher: '',
                    language: ''
                    },
            fileList: [],
            labelWidth: '120px',
            contentsTree: [],
            rules: {
                title:     [{validator: validateRequire}],
                author:    [{validator: validateRequire}],
                publisher: [{validator: validateRequire}],
                language:  [{validator: validateRequire}]
            }
        }
    },
    created() {
        console.log(this.$route.params)
        if (this.isEdit) {
            const fileName = this.$route.params.fileName
            this.getBookData(fileName)
        }
        
    },
    methods: {
        getBookData(fileName) {
            getBook(fileName).then( response => {
                this.setData(response.data)
            })
        },
        setData(data) {
            const { 
                    title,
                    author,
                    publisher,
                    language,
                    rootFile,
                    cover,
                    coverPath,
                    url,
                    unzipUrl,
                    originalName,
                    fileName,
                    filePath,
                    contents,
                    contentsTree,
                    unzipPath
                } = data
            this.postForm = {
                ...this.postForm,
                    title,
                    author,
                    publisher,
                    language,
                    rootFile,
                    cover,
                    coverPath,
                    url,
                    unzipUrl,
                    originalName,
                    fileName,
                    filePath,
                    contents,
                    contentsTree,
                    unzipPath
            }
            this.contentsTree = contentsTree
            this.fileList = [{ name: originalName || fileName, url}]
        },
        setDefault () {
            // this.postForm = Object.assign({} ,defaultForm)
            this.contentsTree = []
            this.fileList = []
            this.$refs.postForm.resetFields()
        },
        onUploadsuccess (data) {
            console.log('onUploadsuccess', data)
            this.setData(data)
        },
        onUploadeRemove() {
            console.log('onUploadeRemove')
            this.setDefault()
        },
        showGuide() {
            console.log('show showGuide...')
        },
        success(response) {
            console.log(response)
            const { msg } = response
            // this.$message({ message: response.msg, type: 'success'})
            this.$notify({
                title: '操作成功',
                message: msg,
                type: 'success',
                duration: 5000
            })
            this.loading = false
        },
        submitFrom() {
            if (!this.loading) {
                this.loading = true
                this.$refs.postForm.validate( (valid, fields) => {
                    // console.log(valid, fields, 'xxxxxxxxxxx')
                    if(valid) {
                        const book = Object.assign({}, this.postForm)
                        //delete book.contents
                        delete book.contentsTree
                        console.log(book)
                        if (!this.isEdit) {
                            createBook(book).then( response => {
                                this.success(response)
                                
                                this.setDefault()
                            }).catch((err) => {
                                this.loading = false
                            })
                        } else {
                            updateBook(book).then( response => {
                                this.success(response)
                                // this.setDefault()
                            }).catch((err) => {
                                this.loading = false
                            })

                        }

                    } else {
                        console.log()
                        const message = fields[Object.keys(fields)[0]][0].message
                        this.$message({ message, type: 'error'})
                        this.loading = false
                    }
                })
            }
        },
        onContentClick(data, node, item ) {
            console.log(data, node, item)
            if(data.text) {
                window.open(data.text)
            }
        }
    }
}
</script>

<style lang="scss" scoped>
    .detail-container {
        padding: 40px 50px 20px;
        .preview-img{
            width: 200px;
            height: 270px;
        }
    }
</style>
