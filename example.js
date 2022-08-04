import './build/index.js'
import {log} from './build/utils.js'
import { pair, encrypt, decrypt } from './build/index.js'
import {read} from './build/utils.js'
(async function () {
    console.clear()
   let {dependencies} = JSON.parse(await read('./package.json'))
    // Generate keypair (Optional parameters === password, and salt array)
let keys = await pair()
log('\nKEYPAIR\n',keys)
    // Encrypt document
let encrypted = await encrypt(dependencies,keys, {compress: true, encoding: 'utf16'})
    log('\nENCRYPTED\n', encrypted)

    // Decrypt document
let decrypted = await decrypt(encrypted,keys)
    log('\nDECRYPTED\n', decrypted)
}   )()

