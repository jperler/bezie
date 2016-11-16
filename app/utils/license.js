import crypto from 'crypto'
import { SECRET } from '../constants'

const ALGORITHM = 'aes-128-ecb'

export default function decrypt (data) {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        new Buffer(SECRET, 'base64'),
        new Buffer(0)
    )
    decipher.setAutoPadding(true)
    return decipher.update(data, 'base64', 'utf8') + decipher.final('utf8')
}
