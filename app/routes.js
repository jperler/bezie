import React from 'react'
import { Route, IndexRoute } from 'react-router'
import App from './containers/app'
import Bezie from './containers/bezie'
import Settings from './containers/settings'

export default (
    <Route path="/" component={App}>
        <IndexRoute component={Bezie} />
        <Route path="/settings" component={Settings} />
    </Route>
)
