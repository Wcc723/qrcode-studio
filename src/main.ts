import { ViteSSG } from 'vite-ssg'
import App from './App.vue'
import { routes } from './router'
import 'uno.css'
import './styles/main.css'

export const createApp = ViteSSG(App, { routes })
