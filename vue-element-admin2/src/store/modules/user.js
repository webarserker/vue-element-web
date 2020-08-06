import { login, getInfo } from '@/api/user'
import { getToken, setToken, removeToken } from '@/utils/auth'
import router, { resetRouter, constantRoutes } from '@/router'
import Layout from '@/layout'

const state = {
  token: getToken(),
  name: '',
  avatar: '',
  introduction: '',
  roles: [],
  routers: constantRoutes,
  addRouters: []
}

const mutations = {
  SET_TOKEN: (state, token) => {
    state.token = token
  },
  SET_INTRODUCTION: (state, introduction) => {
    state.introduction = introduction
  },
  SET_NAME: (state, name) => {
    state.name = name
  },
  SET_AVATAR: (state, avatar) => {
    state.avatar = avatar
  },
  SET_ROLES: (state, roles) => {
    state.roles = roles
  },
  SET_ROUTERS: (state, addRouters) => {
    state.addRouters = addRouters
  }
}

const formatRouter = (routers) => {
  const formatRouters = [];
  routers.forEach(router => {
    const path = router.path;
    const name = router.name;
    const title = router.title;
    const component = router.component;
    const icon = router.icon;
    const formatRouter = {
      path: '/book',
      component: Layout,
      redirect: '/book/create',
      children: [{
        path: path,
        name: name,
        component(resolve) {
          require(["@/views" + component], resolve)
        },
        meta: {
          title: title,
          icon: icon
        }
      }]
    }
 
    formatRouters.push(formatRouter)
  })
  console.log(formatRouters, 'formatRouters')
  return formatRouters
}

const actions = {
  // user login
  login({ commit }, userInfo) {
    const { username, password } = userInfo
    
    return new Promise((resolve, reject) => {
      // console.log(commit, username.trim(),  password, userInfo, 'username: username.trim(), password: password')
      login({ username: username.trim(), password: password }).then(response => {
        const { data } = response
        console.log(data)
        commit('SET_TOKEN', data.token)
        setToken(data.token)
        resolve()
      }).catch(error => {
        console.log(error)
        reject(error)
      })
    })
  },

  // get user info
  getInfo({ commit, state }) {
    return new Promise((resolve, reject) => {
      getInfo(state.token).then(response => {
        const { data } = response

        if (!data) {
          reject('Verification failed, please Login again.')
        }

        const { roles, name, avatar, introduction } = data

        // roles must be a non-empty array
        if (!roles || roles.length <= 0) {
          reject('getInfo: roles must be a non-null array!')
        }

        commit('SET_ROLES', roles)
        commit('SET_NAME', name)
        commit('SET_AVATAR', avatar)
        commit('SET_INTRODUCTION', introduction)
        resolve(data)
      }).catch(error => {
        reject(error)
      })
    })
  },


  generateRouter({
    commit
  }, routers) {
    return new Promise((resolve) => {
      const accessedRouters = formatRouter(routers)
      console.log(accessedRouters, 'accessedRoutersaccessedRouters')
      commit('SET_ROUTERS', accessedRouters);
      resolve();
    })
  },

  // user logout
  logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      try {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        dispatch('tagsView/delAllViews', null, { root: true })
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  },

  // remove token
  resetToken({ commit }) {
    return new Promise(resolve => {
      commit('SET_TOKEN', '')
      commit('SET_ROLES', [])
      removeToken()
      resolve()
    })
  },

  // dynamically modify permissions
  async changeRoles({ commit, dispatch }, role) {
    const token = role + '-token'

    commit('SET_TOKEN', token)
    setToken(token)

    const { roles } = await dispatch('getInfo')

    resetRouter()

    // generate accessible routes map based on roles
    const accessRoutes = await dispatch('permission/generateRoutes', roles, { root: true })
    // dynamically add accessible routes
    router.addRoutes(accessRoutes)

    // reset visited views and cached views
    dispatch('tagsView/delAllViews', null, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
