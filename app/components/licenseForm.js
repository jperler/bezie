import React, { Component, PropTypes } from 'react'
import { shell } from 'electron'
import ReactDOM from 'react-dom'
import storage from 'electron-json-storage'
import {
    Button,
    Modal,
    Form,
    FormGroup,
    Col,
    FormControl,
} from 'react-bootstrap'
import { STORAGE_KEY } from '../constants'

class LicenseForm extends Component {
    static propTypes = {
        authorize: PropTypes.func.isRequired,
        license: PropTypes.object.isRequired,
        authorized: PropTypes.bool.isRequired,
    }

    onReset () {
        storage.remove(STORAGE_KEY, () => {
            this.props.authorize()
        })
    }

    onSubmit () {
        const email = ReactDOM.findDOMNode(this.email).value
        const key = ReactDOM.findDOMNode(this.key).value
        const data = { email, key }

        storage.set(STORAGE_KEY, data, () => {
            this.props.authorize()
        })
    }

    onPurchaseClick (e) {
        e.preventDefault()
        shell.openExternal('http://www.bezie.io')
    }

    render () {
        const { license, authorized } = this.props
        const invalid = license.email && license.key && !authorized

        return (
            <Modal show>
                <Modal.Header>
                    <Modal.Title>License</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {invalid && <p style={{ color: 'red' }}>Invalid Key: {license.key}</p>}
                    <p>
                        Please enter your license key below or purchase one from
                        {' '}
                        <a
                            href
                            onClick={::this.onPurchaseClick}
                            style={{ textDecoration: 'underline' }}
                        >
                            bezie.io
                        </a>.
                    </p>
                    <Form horizontal>
                        <FormGroup controlId="formHorizontalEmail" bsSize="sm">
                            <Col sm={6}>
                                <FormControl
                                    ref={input => this.email = input}
                                    type="email"
                                    placeholder="Email"
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup controlId="formHorizontalPassword" bsSize="sm">
                            <Col sm={6}>
                                <FormControl
                                    ref={input => this.key = input}
                                    type="text"
                                    placeholder="License key"
                                />
                            </Col>
                        </FormGroup>
                        <FormGroup>
                            <Col sm={6}>
                                <Button
                                    bsSize="sm"
                                    type="submit"
                                    onClick={::this.onSubmit}
                                >
                                    Authorize
                                </Button>
                            </Col>
                        </FormGroup>
                    </Form>
                </Modal.Body>
            </Modal>
        )
    }
}

export default LicenseForm
