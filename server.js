const ursa = require('ursa-purejs');
const net = require('net');
const express = require('express');
const bodyParser = require('body-parser');

const app = express();
const port = 3000;

app.use(bodyParser.json());

app.post('/sendData', async (req, res) => {
    const settings = req.body;

    settings.key = settings.key.replace(/ /g, '+');
    settings.key = wordwrap(settings.key, 65, true);
    const timestampdata = settings.data.timestamp ? new Date(settings.data.timestamp) : new Date().getTime();
    const pubKey = Buffer.from('-----BEGIN PUBLIC KEY-----\n' + settings.key + '\n-----END PUBLIC KEY-----\n');

    const build = 'VOTE\n' + settings.data.site + '\n'+ settings.data.user + '\n' + settings.data.addr + '\n'+timestampdata+'\n';
    const buf = Buffer.from(build, 'binary');

    const key = ursa.createPublicKey(pubKey);

    try {
        const data = key.encrypt(build, 'binary', 'binary', ursa.RSA_PKCS1_PADDING);

        const connection = net.createConnection({
            host: settings.host,
            port: settings.port
        });

        const connectPromise = new Promise((resolve, reject) => {
            connection.on('connect', resolve);
            connection.on('error', reject);
        });

        await connectPromise;

        connection.write(data, 'binary', () => {
            connection.end();
            res.status(200).send('Data sent successfully');
        });

        connection.setTimeout(settings.timeout || 2000, () => {
            connection.end();
            if (!res.headersSent) {
                res.status(500).send('Socket timeout');
            }
        });

    } catch (error) {
        res.status(400).send("err: ip or port offline or crushed! contact admin of that server.");
    }
});

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

function wordwrap(str, maxWidth) {
    let newLineStr = "\n"; done = false; res = '';
    do {
        found = false;

        if (!found) {
            res += [str.slice(0, maxWidth), newLineStr].join('');
            str = str.slice(maxWidth);
        }

        if (str.length < maxWidth){
            res += str;
            done = true;
        }

    } while (!done);

    return res;
}
