import React, { Component, PropTypes } from 'react'

export default class Seek extends Component {
    static propTypes = {
        height: PropTypes.number.isRequired,
    }

    render () {
        return (
            <path
                stroke={'#FFF'}
                strokeOpacity={0.25}
                style={{ display: 'none' }}
                ref={el => window.seek = el}
            />
        )
    }
}
