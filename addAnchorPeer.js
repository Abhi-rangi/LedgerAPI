const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const channelName = 'fd';
const org3MSP = 'Org3MSP';
const ordererEndpoint = 'orderer.example.com:7050';
const fabricBinPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/bin';
const fabricCfgPath = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/config';

function setEnvVariables(org) {
    const orgMSP = org === 'Org1' ? 'Org1MSP' : (org === 'Org2' ? 'Org2MSP' : 'Org3MSP');
    const peerAddress = org === 'Org1' ? `localhost:7051` : (org === 'Org2' ? `localhost:9051` : `localhost:11051`);
    const peerCertFile = org === 'Org1' ? 
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt') :
        (org === 'Org2' ? path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt') :
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org3.example.com', 'peers', 'peer0.org3.example.com', 'tls', 'ca.crt'));
    const peerMSPConfigPath = org === 'Org1' ? 
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp') :
        (org === 'Org2' ? path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'Admin@org2.example.com', 'msp') :
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org3.example.com', 'users', 'Admin@org3.example.com', 'msp'));

    return {
        ...process.env,
        PATH: `${fabricBinPath}:${process.env.PATH}`,
        FABRIC_CFG_PATH: fabricCfgPath,
        CORE_PEER_LOCALMSPID: orgMSP,
        CORE_PEER_TLS_ROOTCERT_FILE: peerCertFile,
        CORE_PEER_MSPCONFIGPATH: peerMSPConfigPath,
        CORE_PEER_ADDRESS: peerAddress,
        CORE_PEER_TLS_ENABLED: 'true',
    };
}

function execCommand(command, env) {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit', env });
}

async function main() {
    try {
        const envOrg1 = setEnvVariables('Org1');
        const envOrg2 = setEnvVariables('Org2');
        const envOrg3 = setEnvVariables('Org3');

        // Step 1: Fetch the current channel configuration block
        execCommand(`peer channel fetch config config_block.pb -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, envOrg3);

        // Step 2: Decode the configuration block to JSON
        execCommand(`configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, envOrg3);
        execCommand(`jq .data.data[0].payload.data.config config_block.json > config.json`, envOrg3);

        // Step 3: Modify the configuration to include the anchor peer for Org3MSP
        const configJson = JSON.parse(fs.readFileSync('config.json'));
        configJson.channel_group.groups.Application.groups[org3MSP].values.AnchorPeers = {
            mod_policy: "Admins",
            value: {
                anchor_peers: [
                    {
                        host: "peer0.org3.example.com",
                        port: 11051
                    }
                ]
            }
        };

        fs.writeFileSync('modified_config.json', JSON.stringify(configJson));

        // Step 4: Encode the original and modified configurations to protobuf
        execCommand(`configtxlator proto_encode --input config.json --type common.Config --output config.pb`, envOrg3);
        execCommand(`configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb`, envOrg3);

        // Step 5: Compute the update configuration
        execCommand(`configtxlator compute_update --channel_id ${channelName} --original config.pb --updated modified_config.pb --output config_update.pb`, envOrg3);

        // Step 6: Decode the update to JSON
        execCommand(`configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json`, envOrg3);

        // Step 7: Wrap the update in an envelope message
        execCommand(`echo '{"payload":{"header":{"channel_header":{"channel_id":"${channelName}", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_in_envelope.json`, envOrg3);

        // Step 8: Encode the envelope message to protobuf
        execCommand(`configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output config_update_in_envelope.pb`, envOrg3);

        // Step 9: Sign the configuration update as Org1
        execCommand(`peer channel signconfigtx -f config_update_in_envelope.pb`, envOrg1);

        // Step 10: Sign the configuration update as Org2
        execCommand(`peer channel signconfigtx -f config_update_in_envelope.pb`, envOrg2);

        // Step 11: Submit the configuration update
        execCommand(`peer channel update -f config_update_in_envelope.pb -c ${channelName} -o ${ordererEndpoint} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, envOrg3);

        console.log('Anchor peer successfully added to Org3MSP');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();
