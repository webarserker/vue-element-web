<template>
  <div id="app">
    <router-view />
  </div>
</template>

<script>
export default { // vue-router 服用组件原则上是屏蔽了用户修改URL对页面的刷新，如果需要url的双向绑定，可以加入一个key
  name: 'App'
}
</script>
