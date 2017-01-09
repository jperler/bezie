import crypto from 'crypto'
import { SECRET_FRAGMENT } from '../constants'

const ALGORITHM = 'aes-128-ecb'

export default function decrypt (key, secret) {
    const decipher = crypto.createDecipheriv(
        ALGORITHM,
        new Buffer(SECRET_FRAGMENT + secret, 'base64'),
        new Buffer(0)
    )
    decipher.setAutoPadding(true)
    return decipher.update(key, 'base64', 'utf8') + decipher.final('utf8')
}
