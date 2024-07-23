const { execSync } = require('child_process');
const path = require('path');

const absolutePathToFabricSamples = '/Users/abhishek/Documents/HyperLedgerFabric/fabric-samples';
const absolutePathToTestNetwork = path.resolve(absolutePathToFabricSamples, 'test-network');

const chaincodeName = 'basic2';
const chaincodeVersion = '2.0';
const chaincodePath = path.resolve(
  absolutePathToFabricSamples,
  "asset-transfer-basic/Healthcare-chaincode"
);
const channelName = 'mychannel';
const ordererEndpoint = "localhost:7050";

async function main() {
    try {
        // Set environment variables for Fabric binaries and configuration
        process.env.FABRIC_CFG_PATH = path.resolve(absolutePathToFabricSamples, 'config');
        process.env.PATH = `${process.env.PATH}:${path.resolve(absolutePathToFabricSamples, 'bin')}`;

        // Install dependencies for the chaincode
        console.log('Installing chaincode dependencies...');
        execCommand(`npm install`, chaincodePath);

        // Package the chaincode
        console.log('Packaging chaincode...');
        execCommand(`peer lifecycle chaincode package ${chaincodeName}.tar.gz --path ${chaincodePath} --lang node --label ${chaincodeName}_${chaincodeVersion}`, absolutePathToFabricSamples);

        // Install the chaincode on peer0.org1
        console.log('Installing chaincode on peer0.org1...');
        setEnvForPeer('org1');
        execCommandWithRetry(`peer lifecycle chaincode install ${chaincodeName}.tar.gz`, absolutePathToFabricSamples);

        // Install the chaincode on peer0.org2
        console.log('Installing chaincode on peer0.org2...');
        setEnvForPeer('org2');
        execCommandWithRetry(`peer lifecycle chaincode install ${chaincodeName}.tar.gz`, absolutePathToFabricSamples);

        // Get the package ID
        const packageId = getPackageId();

        // Approve the chaincode definition for Org1
        console.log('Approving chaincode definition for Org1...');
        setEnvForPeer('org1');
        execCommandWithRetry(`peer lifecycle chaincode approveformyorg -o ${ordererEndpoint} --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --package-id ${packageId} --sequence 1 --tls --cafile ${ordererCA}`, absolutePathToFabricSamples);

        // Approve the chaincode definition for Org2
        console.log('Approving chaincode definition for Org2...');
        setEnvForPeer('org2');
        execCommandWithRetry(`peer lifecycle chaincode approveformyorg -o ${ordererEndpoint} --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --package-id ${packageId} --sequence 1 --tls --cafile ${ordererCA}`, absolutePathToFabricSamples);

        // Commit the chaincode definition
        console.log('Committing chaincode definition...');
        setEnvForPeer('org1');
        execCommandWithRetry(`peer lifecycle chaincode commit -o ${ordererEndpoint} --ordererTLSHostnameOverride orderer.example.com --channelID ${channelName} --name ${chaincodeName} --version ${chaincodeVersion} --sequence 1 --tls --cafile ${ordererCA} --peerAddresses localhost:7051 --tlsRootCertFiles ${org1PeerCertFile} --peerAddresses localhost:9051 --tlsRootCertFiles ${org2PeerCertFile}`, absolutePathToFabricSamples);

        console.log('Chaincode packaged, approved, and committed successfully.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

function execCommand(command, cwd = null) {
    try {
        console.log(`Executing: ${command}`);
        execSync(command, { stdio: 'inherit', cwd: cwd || process.cwd() });
    } catch (error) {
        console.error(`Command failed: ${command}`);
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

function execCommandWithRetry(command, cwd = null, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            execCommand(command, cwd);
            return;
        } catch (error) {
            console.error(`Retrying command (${i + 1}/${retries}): ${command}`);
            if (i === retries - 1) {
                throw error;
            }
        }
    }
}

function setEnvForPeer(org) {
    if (org === 'org1') {
        process.env.CORE_PEER_TLS_ENABLED = 'true';
        process.env.CORE_PEER_LOCALMSPID = 'Org1MSP';
        process.env.CORE_PEER_TLS_ROOTCERT_FILE = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
        process.env.CORE_PEER_MSPCONFIGPATH = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp');
        process.env.CORE_PEER_ADDRESS = 'localhost:7051';
    } else if (org === 'org2') {
        process.env.CORE_PEER_TLS_ENABLED = 'true';
        process.env.CORE_PEER_LOCALMSPID = 'Org2MSP';
        process.env.CORE_PEER_TLS_ROOTCERT_FILE = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt');
        process.env.CORE_PEER_MSPCONFIGPATH = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org2.example.com/users/Admin@org2.example.com/msp');
        process.env.CORE_PEER_ADDRESS = 'localhost:9051';
    }
}

function getPackageId() {
    const installedChaincodes = execSync(`peer lifecycle chaincode queryinstalled`).toString();
    const pattern = new RegExp(`${chaincodeName}_${chaincodeVersion}:([a-f0-9]{64})`);
    const match = installedChaincodes.match(pattern);
    if (!match) {
        throw new Error('Package ID not found');
    }
    console.log("package ID is:", match[0]);
    return match[0];
}

const ordererCA = path.resolve(absolutePathToTestNetwork, 'organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem');
const org1PeerCertFile = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt');
const org2PeerCertFile = path.resolve(absolutePathToTestNetwork, 'organizations/peerOrganizations/org2.example.com/peers/peer0.org2.example.com/tls/ca.crt');

main();
