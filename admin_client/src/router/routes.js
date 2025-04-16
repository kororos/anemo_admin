
const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', component: () => import('pages/IndexPage.vue') },
      { name: 'live', path: 'live', component: () => import('pages/LivePage.vue'), 
        props: route=> ({uuid: route.query.uuid, device: route.query.device}) },
      { name: 'measurements', path: 'measurements', component: () => import('pages/MeasurementsView.vue'), 
        props: route=> ({uuid: route.query.uuid, device: route.query.device}) }
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
    path: '/public2',
    component: () => import('layouts/LoginLayout.vue'),
    children: [
      { path: '', component: () => import('pages/Public2Page.vue') }
    ]
  },
  {
    path: '/public',
    component: () => import('layouts/PublicLayout.vue'),
    children: [
      { 
        path: '', 
        component: () => import('pages/PublicPage.vue'),
        props: route => ({ deviceName: route.query.device })
      }
    ]
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
      { path: '', component: () => import('pages/SignUpPage.vue') }
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
