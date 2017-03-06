import fs from 'fs'
import decrypt from '../utils/license'

const INVALID_FILE_MESSAGE = 'Oops! This file is invalid.'

export function save (sender, filename, { paths, zoom, bars, authorized, license, settings }) {
    if (decrypt(license.key, license.secret) !== license.email) return
    if (authorized) fs.writeFile(filename, JSON.stringify({ bars, paths, zoom, settings }))
}

export function open (sender, filename, { bootstrap, authorized, license }) {
    if (decrypt(license.key, license.secret) !== license.email) return

    fs.readFile(filename, (error, json) => {
        let data

        try {
            data = JSON.parse(json)
        } catch (e) {
            alert(INVALID_FILE_MESSAGE) // eslint-disable-line
        }

        if (authorized && data) bootstrap(data)
    })
}
