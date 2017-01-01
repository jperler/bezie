import React from 'react'
import { render } from 'react-dom'
import { Provider } from 'react-redux'
import { Router, hashHistory } from 'react-router'
import { syncHistoryWithStore } from 'react-router-redux'
import { webFrame } from 'electron'
import routes from './routes'
import configureStore from './store/configureStore'
import './app.global.css'

const store = configureStore()
const history = syncHistoryWithStore(hashHistory, store)

// Disable native broswer zoom
webFrame.setZoomLevelLimits(1, 1)

render(
    <Provider store={store}>
        <Router history={history} routes={routes} />
    </Provider>,
    document.getElementById('root')
)
