import { combineReducers } from 'redux'
import { routerReducer as routing } from 'react-router-redux'
import bezie from './bezie'

const rootReducer = combineReducers({
    bezie,
    routing,
})

export default rootReducer
