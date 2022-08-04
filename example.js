import Gun from "gun";
import './build/index.js'

const gun = Gun({ file: 'CHAINLOCKERTEST' });
(async () => {
    console.clear();
    // Generate your keys with a string or array of strings.
    // If no salt string is provided then immutable os data (username, platform, & arch) is used.
    let keypair = await gun.keys(['username', 'password', 'another_secret', 'we can do this all day']);
    console.log("SEA KEYPAIR \n", keypair);
    // Here we start our vault context
    let vault = gun.vault('VaultContextName', keypair)

    
    // Here we start our chain. The keys stay in the vault context encrypting/decrypting when using the /
    // .locker() && .value() methods.

    // .locker method takes the path to the node as an array or a string separated by a solidus '/' or period '.'
    let locker = gun
        .locker(['newvault', 'test', 'path', 'to', 'node'])

    // .put method takes the data object to be stored and a callback function is optionally passed to verify the put
    // Data is automically encrypted and compressed.
    locker
        .put({ Lemon: 'Orange', Apple: 'Banana', Orange: 'Apple' });
// 
//     // .value method takes a callback function to return the decoded data 
    locker.value((data) => {
        console.log("NODE DATA \n", data);
    })
// Here we can see the data is encrypted and compressed at the specified node location.
    vault.get('newvault').get('test').get('path').get('to').get('node').once((data) => {
        console.log("NODE DATA 2 \n", data);
    })
})()