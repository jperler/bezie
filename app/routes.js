import React from 'react'
import { Route, IndexRoute } from 'react-router'
import App from './containers/app'
import Bezie from './containers/bezie'

export default (
    <Route path="/" component={App}>
        <IndexRoute component={Bezie} />
    </Route>
)
