import Vue from 'vue'
import Router from 'vue-router'
import PKIIdLogin from './views/PKIIdLogin.vue'
import Register from './views/Register.vue'
import config from './config'
// import AppDetails from './views/AppDetails.vue'
// import IssueCredential from './views/IssueCredential.vue'
import Credential from './views/Credential.vue'
import Presentation from './views/Presentation.vue'
import Dashboard from './views/Dashboard.vue'
// import Profile from './views/Profile.vue'
import fetch from 'node-fetch'
import Schema from './views/Schema.vue'

Vue.use(Router)

const router =  new Router({
  mode: 'history',
  routes: [
    {
      path: '/login',
      redirect: '/studio/login'
    },
    {
      path: '/studio',
      redirect: '/studio/login'
    },
    {
      path: '/studio/login',
      name: 'PKIIdLogin',
      component: PKIIdLogin
    },
    {
      path: '/studio/dashboard',
      name: 'dashboard',
      component: Dashboard,
      meta: {
        requiresAuth: true
      } 
    },
    {
      path: '/studio/register',
      name: 'register',
      component: Register
    },
    // {
    //   path: '/studio/profile',
    //   name: 'profile',
    //   component: Profile,
    //   meta: {
    //     requiresAuth: true
    //   } 
    // },
    {
      path: '/studio/schema',
      name: 'schema',
      component: Schema,
      meta: {
        requiresAuth: true
      } 
    },
    // {
    //   path: '/studio/apps/:appId',
    //   name: 'appdetails',
    //   component: AppDetails,
    //   meta: {
    //     requiresAuth: true
    //   } 
    // },
    {
      path: '/studio/credential',
      name: 'credential',
      component: Credential,
      meta: {
        requiresAuth: true
      } 
    },
    {
      path: '/studio/presentation',
      name: 'presentation',
      component: Presentation,
      meta: {
        requiresAuth: true
      } 
    },
    // {
    //   path: '/studio/apps/:appId/issue',
    //   name: 'issueCredential',
    //   component: IssueCredential,
    //   meta: {
    //     requiresAuth: true
    //   } 
    // }
  ]
})

router.beforeEach((to, from, next) => {
  if(to.matched.some(record => record.meta.requiresAuth)){
    const authToken = localStorage.getItem('authToken')
    if(authToken){
      const url = `${config.studioServer.BASE_URL}api/auth/verify`
      console.log(url)
      fetch(url,{
        headers: {
          'x-auth-token': authToken
        },
        method: 'POST'
      }).then(res => res.json())
      .then(json => {
        if(json.status == 403){
          next({
            path: '/studio/login',
            params: { nextUrl:  to.fullPath}
          })  
        }else{
          next()
        }
      })
      .catch((e)=> {
        next({
          path: '/studio/login',
          params: { nextUrl:  to.fullPath}
        })
      })
    }else{
      next({
        path: '/studio/login',
        params: { nextUrl:  to.fullPath}
      })
    }
  }else{
    next()
  }
})
export default router
