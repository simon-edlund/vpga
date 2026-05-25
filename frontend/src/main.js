import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { Quasar, Dialog, Notify } from 'quasar'
import App from './App.vue'
import router from './router/index.js'
import './style.css'
import 'quasar/src/css/index.sass'
import './styles/quasar-app.scss'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(Quasar, {
  plugins: { Dialog, Notify },
  config: {
    brand: {
      primary: '#1b4332',
      secondary: '#2d6a4f',
      accent: '#95d5b2',
      positive: '#2e7d32',
      negative: '#b42318',
      info: '#2563eb',
      warning: '#b7791f',
    },
  },
})
app.mount('#app')
