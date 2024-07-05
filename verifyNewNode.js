const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const channelName = 'mychannel';
const orgMsp = 'Org1MSP';
const ordererEndpoint = 'orderer.example.com:7050';
const fabricBinPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/bin';
const fabricCfgPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/config';

async function verifyPeerAddition() {
    try {
        // Set environment variables
        const env = {
            ...process.env,
            PATH: `${fabricBinPath}:${process.env.PATH}`,
            FABRIC_CFG_PATH: fabricCfgPath,
            CORE_PEER_LOCALMSPID: orgMsp,
            CORE_PEER_TLS_ROOTCERT_FILE: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt'),
            CORE_PEER_MSPCONFIGPATH: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp'),
            CORE_PEER_ADDRESS: 'localhost:7051',
            CORE_PEER_TLS_ENABLED: 'true',
        };

        // Fetch the latest channel configuration block
        execSync(`peer channel fetch config config_block.pb -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, { env });

        // Decode the configuration block to JSON
        execSync(`configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, { env });
        execSync(`jq .data.data[0].payload.data.config config_block.json > config.json`, { env });

        // Read and print the anchor peers from the config.json file
        const configJson = JSON.parse(fs.readFileSync('config.json'));
        const anchorPeers = configJson.channel_group.groups.Application.groups[orgMsp].values.AnchorPeers.value.anchor_peers;
        console.log('Anchor Peers:', anchorPeers);

        // Check if the new peer is in the list of anchor peers
        const newPeer = anchorPeers.find(peer => peer.host === 'peer1.org1.example.com' && peer.port === 7051);
        if (newPeer) {
            console.log('The new peer has been successfully added to the channel.');
        } else {
            console.log('The new peer has NOT been added to the channel.');
        }
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

verifyPeerAddition();
