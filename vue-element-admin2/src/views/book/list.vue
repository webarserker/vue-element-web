<template>
    <div class="app-container">
        <div class="filter-container">
            <el-input
                v-model="listQuery.title"
                placeholder="书名"
                style="width: 200px"
                class="filter-item"
                ref="bookName"
                clearable
                @keyup.enter.native="handFilter"
                @clear="handFilter"
                @change="handFilter"
            />

            <el-input
                v-model="listQuery.author"
                placeholder="作者"
                style="width: 200px"
                class="filter-item"
                ref="authorName"
                clearable
                @keyup.enter.native="handFilter"
                @clear="handFilter"
                @input="handFilter"
            />

            <el-select
                v-model="listQuery.category"
                placeholder="分类"
                ref="selectCategory"
                style="width: 200px"
                class="filter-item"
                clearable
                @change="handFilter"
            >
                <el-option 
                    v-for="item in categroyList"
                    :key="item.value"
                    :label="`${item.value} (${item.num})`"
                    :value="item.value"
                    
                ></el-option>
                 
            </el-select>
            <el-button
                v-wavers
                class="filter-item"
                type="primary"
                icon="el-icon-search"
                style="margin-left: 10px"
                @click="handFilter"
            >
                查询
            </el-button>
            <el-button
                class="filter-item"
                type="primary"
                icon="el-icon-edit"
                style="margin-left: 5px"
                @click="handCreate"
            >
                新增
            </el-button>
            <el-checkbox
                v-model="showCover"
                class="filter-item"
                style="margin-left: 5px"
                @click="changeShowCover"
            >
                显示封面
            </el-checkbox>
        </div>
        
        <el-table
            :key="tablekey"
            v-loading="listLoading"
            :data="list"
            :height="tableHeight"
            border
            fit
            highlight-current-row
            style="width: 100%"
            :default-sort="defaultSort"
            @sort-change="sortChange"
           
        >
            <el-table-column
                label="ID"
                prop="id"
                sortable="custom"
                align="center"
                width="80"
            />
            <el-table-column
                label="书名"
                align="center"
                width="150"
            >
                <template v-slot="{ row: {titleWrapper} }">
                    <span v-html="titleWrapper" />
                </template>
            </el-table-column>

            <el-table-column
                label="作者"
                align="center"
                width="150"
            >
                <template v-slot="{ row: {authorWrapper} }">
                    <span v-html="authorWrapper" />
                </template>
            </el-table-column>
            
            <el-table-column
                prop="publisher"
                label="出版社"
                align="center"
                width="150"
            />

            <el-table-column
                prop="categoryText"
                label="种类"
                align="center"
                width="150"
            />

            <el-table-column
                prop="language"
                label="语言"
                align="center"
            />

            <el-table-column
                v-if="showCover"
                label="封面"
                align="center"
            >
                <template v-slot="{ row: {cover} }">
                    <a :href="cover" target="_blank">
                        <img :src="cover" style="width: 120px; height: 180px;" />
                    </a>
                </template>
            </el-table-column>

             <el-table-column
                prop="fileName"
                label="文件名"
                align="center"
                width="100"
            />

            <el-table-column
                prop="filePath"
                label="文件路径"
                align="center"
                width="100"
            >
                <template v-slot="{row: {filePath}}">
                    <span>{{filePath | valueFiter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                prop="coverPath"
                label="封面路径"
                align="center"
                width="100"
            >
                <template v-slot="{row: {coverPath}}">
                    <span>{{coverPath | valueFiter }}</span>
                </template>
            </el-table-column>

             <el-table-column
                prop="unzipPath"
                label="解压路径"
                align="center"
                width="100"
            >
                <template v-slot="{row: {unzipPath}}">
                    <span>{{unzipPath | valueFiter }}</span>
                </template>
            </el-table-column>

             <el-table-column
                prop="createUser"
                label="上传人"
                align="center"
                width="100"
            >
                <template v-slot="{row: {createUser}}">
                    <span>{{createUser | valueFiter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                prop="createDt"
                label="上传时间"
                align="center"
                width="100"
            >
                <template v-slot="{row: {createDt}}">
                    <span>{{createDt | timeFiter }}</span>
                </template>
            </el-table-column>

            <el-table-column
                label="操作"
                align="center"
                width="120"
                fixed="right"
            >
                <template v-slot="{ row }">
                    <el-button type="text" icon="el-icon-edit" @click="handleUpdate(row)">操作</el-button>
                </template>
                
            </el-table-column>

            <el-table-column
                label="删除"
                align="center"
                width="120"
                fixed="right"
            >
                <template v-slot="{ row }">
                    <el-button type="text" icon="el-icon-delete" @click="handleDelete(row)" style="color: #f56c6c">删除</el-button>
                </template>
            </el-table-column>
        </el-table>
        <pagination
            
            :total="tool"
            :limit.sync="listQuery.pageSize"
            :page.sync="listQuery.page"
            @pagination="refresh"
        />
    </div>
</template>

<script>
import Pagination from '../../components/Pagination/index'
import wavers from '../../directive/waves/waves'
import { getCategroy, listBook, deleteBook } from '../../api/book'
import { parseTime } from '../../utils'
import _ from 'lodash'
// :disabled="disabed.length == 0? false : disabed.indexOf(item.value) == -1 "
//v-on:update:limit="sizeChange"
// v-on:update:page="currentChange"
export default {
    components: {
        Pagination
    },
    directives: {
        wavers
    },
    filters: {
        valueFiter(value) {
            return value || '无'
        },
        timeFiter(time) {
            return parseTime(time, '{y}-{m}-{d} {h}:{i}') || '无'
        }
    },
    data() {
        return {
            tablekey: 0,
            listLoading: false,
            listQuery: {},
            showCover: false,
            categroyList: [],
            list: [],
            tool: 0,
            disabed: [],
            led: true,
            tableHeight: window.innerHeight  - 310,
            defaultSort: {} 
        }
    },
    created() {
        this.parseQuery()
        this.debouncedGetAnswer = _.debounce(this.handFilter, 500)  // 改造函数防抖
    },

    mounted() {
        this.getList()
        this.getCategroyList()

        
    },
    methods: {
        debouncedGetAnswer() {

        },
        cancelQuest(){
            if(typeof this.source ==='function'){
                this.source('终止请求'); //取消请求
            }
        },
       isEmpty(obj){
            if(typeof obj == "undefined" || obj == null || obj == ""){
                return true;
            }else{
                return false;
            }
        },

        parseQuery(page = 1, pageSize = 20, ...sort) {
            console.log(page, pageSize, sort)
            if(!!sort) { sort = '+id'} else { sort = sort[0]}
            const query = Object.assign({}, this.$route.query)
            let listQuery = {
                page,
                pageSize,
                sort
            }
            if(query) {
                query.page && (query.page = +query.page)
                query.pageSize && (query.pageSize = +query.pageSize)
                query.sort && (sort = query.sort)
            }
            
            const sortSymbol = sort[0]
            const sortColumn = sort.slice(1, sort.length)
            console.log(sort, sort.slice(1, sort.length), sortSymbol, sortColumn)
            this.defaultSort = {
                prop: sortColumn,
                order: sortSymbol == '+' ? 'ascending' : 'descending'
            }
            this.listQuery = Object.assign(listQuery, query)
            
            console.log(this.listQuery, this.$route.query)
        },
        sortChange(data) {
            console.log('sortChange', data)
            const { prop, order } = data
            this.sortBy(prop, order)
        },
        sortBy(prop, order) {
            if(order === 'ascending')   {
                this.listQuery.sort = `+${prop}`
            } else {
                this.listQuery.sort = `-${prop}`
            }
            this.handFilter()
        },
        wrapperKeywork(k, v) {
            function highlight (value) {
                return `<span style="color:#1890ff">${value}</span>`
            }
            if(!this.listQuery[k]) {
                return v
            } else {
                return v.replace(new RegExp(this.listQuery[k], ), v => highlight(v))
            }
        },
        getList() {
            this.listLoading = true
            

            listBook(this.listQuery).then(response => {
                console.log(response, 'ressssss')
                const { list, tool } = response.data
                this.list = list
                this.tool = response.tool
                this.listLoading = false
                this.list.forEach(book => {
                    book.titleWrapper = this.wrapperKeywork('title', book.title)
                    book.authorWrapper = this.wrapperKeywork('author', book.author)
                }) 
            })
        },
        getCategroyList() {
            const vel = {}
            getCategroy(this.listQuery).then( response => {
                this.categroyList = response.data
            })
        },
        refresh() {
            this.$router.push({
                path: '/book/list',
                query: this.listQuery
            })
        },
        handFilter(ever) {
            this.listQuery.page = 1
            this.refresh()
            // this.getList()
            // this.getCategroyList()
            // this.$nextTick(() => {
            //     if(this.$refs.bookName.value != undefined || this.$refs.authorName.value != undefined){
            //         if(this.led){
            //         this.setDisabed()
            //         }
            //         this.led = false
            //     } 
                
            //     if(this.isEmpty(this.$refs.bookName.value) && this.isEmpty(this.$refs.authorName.value)){ 
            //             this.getCategroyList()
            //             this.disabed = []
            //             this.led = true
            //     }
            // })
        },
        clearHandFilter() {
            this.getList()
            
            // window.vm.$refs['bookName'].resetFields()
            // this.$nextTick(() => {
            //      console.log( this.$refs.authorName.value, this.$refs.bookName.value, this.isEmpty(this.$refs.bookName.value) )
            // })

            

            // if(this.$refs.bookName.value != undefined || this.$refs.authorName.value != undefined){
            //     if(this.led){
            //        this.setDisabed()
            //     }
            //     this.led = false
            // }   

            if(typeof this.$refs.bookName.value === undefined && typeof this.$refs.authorName.value === undefined){ 
                 this.getCategroyList()
                 // this.disabed = []
                 console.log(1111111111111)
            }
        },
        handCreate() {
            this.$router.push('/book/create')
        },
        changeShowCover(value) {
            this.showCover = value
        },
        handleUpdate(row) {
            this.$router.push(`/book/edit/${row.fileName}`)
        },
        handleDelete(row) {
            console.log('1dddd')
            this.$confirm('是否删除该电子书并且移除本地文件？', '提示', {
                confirmButtonText: '确认删除',
                cancelButtonText: '取消',
                type: 'warning'
            }).then(() => {
               console.log(row, 'xxxxxx')
               deleteBook(row.fileName).then( response => {
                   const { msg } = response
                   this.$notify({
                        title: '图书删除成功',
                        message: msg || '删除成功',
                        type: 'success',
                        duration: 5000
                    })
                    this.handFilter()
               })
            })
        },
        sizeChange(pageSize) {
            this.parseQuery(this.listQuery.page, pageSize)
            this.getList()
        },
        currentChange(current) {
             console.log(current, 'xxxxxxxxx')
             this.parseQuery(current, this.listQuery.pageSize)
             this.getList()
        },
        setDisabed(count) {
            const dbl = []
            Object.keys(this.list).find( item => {
                dbl.push(this.list[item].categoryText)
            })
            this.disabed =  [...new Set(dbl)]
            
        }
    },
    beforeRouteUpdate(to, from, next) { 
        console.log(to, from)
        if(to.path === from.path) {
            const newQuery = Object.assign({}, to.query)
            const oldQuery = Object.assign({}, from.query)
            if( JSON.stringify(newQuery) !== JSON.stringify(oldQuery)) {
                console.log(this.defaultSort)
                console.log(this.defaultSort)
                this.getList()
                this.getCategroyList()
                
            }
        }
        next()
    }
    
}




</script>

<style lang="scss" scoped>

</style>