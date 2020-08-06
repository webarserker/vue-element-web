import _import from '../router/_import'// 获取组件的方法

function addRouter(routerlist) {
    // 删除无用属性
    delete e.code
    delete e.sort
    delete e.generatemenu
    delete e.description
    delete e.permName
    delete e.id
    delete e.parentId

    e.path = e.url
    delete e.url

    e.component = _import(e.name)


}