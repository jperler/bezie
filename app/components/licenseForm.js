import React, { Component, PropTypes } from 'react'
import { shell } from 'electron'
import ReactDOM from 'react-dom'
import storage from 'electron-json-storage'
import request from 'request'
import {
    Button,
    Form,
    FormGroup,
    Col,
    FormControl,
} from 'react-bootstrap'
import Modal, { Header, Title, Body } from 'react-bootstrap/lib/Modal'
import { STORAGE_KEY, ACTIVATION_BASE_URL } from '../constants'

class LicenseForm extends Component {
    static propTypes = {
        authorize: PropTypes.func.isRequired,
        license: PropTypes.object.isRequired,
        authorized: PropTypes.bool.isRequired,
    }

    onSubmit (e) {
        e.preventDefault()

        const email = ReactDOM.findDOMNode(this.email).value
        const key = ReactDOM.findDOMNode(this.key).value

        request.post(`${ACTIVATION_BASE_URL}/activate`, {
            form: { email, license: key },
        }, (err, response, body) => {
            if (!err && response.statusCode === 200) {
                storage.set(STORAGE_KEY, JSON.parse(body), () => this.props.authorize())
                alert(`Successfully activated!`) // eslint-disable-line
            } else {
                alert(`Activation failed!`) // eslint-disable-line
            }
        })
    }

    onPurchaseClick (e) {
        e.preventDefault()
        shell.openExternal('http://www.bezie.io')
    }

    render () {
        return (
            <Modal show>
                <Header>
                    <Title>License</Title>
                </Header>
                <Body>
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
                    <p style={{ color: '#555' }}>Requires an internet connection.</p>
                </Body>
            </Modal>
        )
    }
}

export default LicenseForm
