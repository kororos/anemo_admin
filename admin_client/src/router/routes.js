
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { name: 'live', path: 'live/:uuid', component: () => import('pages/LivePage.vue'), props: true }
    ],
  },
  {
    path: '/uploadFirmware',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/UploadFirmware.vue') }
    ],
    meta: { roles: ['admin'] }
  },
  {
    path: '/devices',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/DevicesPage.vue') }
    ],
    meta: { roles: ['admin'] }
  },
  {
    path: '/login',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') }
    ]
  },
  {
    path: '/signup',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/SignupPage.vue') }
    ]
  },

  {
    path: '/login_successful',
    //redirect: '/uploadFirmware'
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/LoginPage.vue') }
    ],
  },
  // {
  //   path: '/live/:uuid',
  //   component: () => import('layouts/MainLayout.vue'),
  //   children: [
  //     { name: 'live', path: '', component: () => import('pages/LivePage.vue'), props: true }
  //   ],
  // },
  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
