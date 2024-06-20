const { FabricCAServices, Wallets } = require('fabric-network');
const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

async function main() {
    const ccpPath = path.resolve(
        "/Users/abhishek/fabric-samples/test-network/organizations/peerOrganizations/org1.example.com",
        "connection-org1.yaml"
    );
    const ccp = yaml.load(fs.readFileSync(ccpPath, 'utf8'));

    // Setup the CA Client
    const caInfo = ccp.certificateAuthorities['ca.org1.example.com'];
    const caTLSCACerts = caInfo.tlsCACerts.pem;
    const ca = new FabricCAServices(caInfo.url, {
        trustedRoots: caTLSCACerts,
        verify: false
    }, caInfo.caName);

    // Create a new wallet : Note that wallet is for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);

    // Check to see if we've already enrolled the admin user.
    const adminExists = await wallet.get('admin');
    if (adminExists) {
        console.log('An identity for the admin user "admin" already exists in the wallet');
        return;
    }

    // Enroll the admin user, and import the new identity into the wallet.
    const enrollment = await ca.enroll({
        enrollmentID: 'admin',
        enrollmentSecret: 'adminpw'
    });
    const identity = {
        credentials: {
            certificate: enrollment.certificate,
            privateKey: enrollment.key.toBytes(),
        },
        mspId: 'Org1MSP',
        type: 'X.509',
    };
    await wallet.put('admin', identity);
    console.log('Successfully enrolled admin user "admin" and imported it into the wallet');
}

main();
