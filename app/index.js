/*
@license

Bezie grants you a revocable, non-exclusive, non-transferable, limited license to download, install and use the Application solely for your personal, non-commercial purposes strictly in accordance with the terms of this Agreement.

Restrictions

You agree not to, and you will not permit others to:

license, sell, rent, lease, assign, distribute, transmit, host, outsource, disclose or otherwise commercially exploit the Application or make the Application available to any third party.
copy or use the Application for any purpose other than as permitted under the above section 'License'.
modify, make derivative works of, disassemble, decrypt, reverse compile or reverse engineer any part of the Application.
remove, alter or obscure any proprietary notice (including any notice of copyright or trademark) of Bezie or its affiliates, partners, suppliers or the licensors of the Application.
Intellectual Property

The Application, including without limitation all copyrights, patents, trademarks, trade secrets and other intellectual property rights are, and shall remain, the sole and exclusive property of Bezie.
*/

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
