import {createRouter, createWebHashHistory} from "vue-router";
import createRouterInstance from '@viur/vi-components/routes'

const routes = [
  //define new Routes
]


const router = createRouterInstance(routes) //extend or replace routes
console.log(router)
export default router
