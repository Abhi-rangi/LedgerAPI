const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const absolutePathToTestNetwork = '/Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network';
const channelName = 'abi';
const newOrgMSP = 'Org3MSP';
const newOrgConfigPath = `${absolutePathToTestNetwork}/organizations/peerOrganizations/org3.example.com/org3.json`;
const ordererEndpoint = 'orderer.example.com:7050';
const fabricBinPath = `${absolutePathToTestNetwork}/../bin`;
const fabricCfgPath = `${absolutePathToTestNetwork}/config`;

function execCommand(command, env) {
    console.log(`Executing: ${command}`);
    execSync(command, { stdio: 'inherit', env });
}

async function createOrg3CryptoMaterial() {
    // Change to addOrg3 directory
    const addOrg3Dir = path.join(absolutePathToTestNetwork, 'addOrg3');
    process.chdir(addOrg3Dir);

    // Step 1: Generate Org3 Crypto Material
    execCommand(`../../bin/cryptogen generate --config=org3-crypto.yaml --output="../organizations"`);

    // Step 2: Generate Org3 Organization Definition
    execCommand(`export FABRIC_CFG_PATH=${addOrg3Dir} && ../../bin/configtxgen -printOrg Org3MSP > ../organizations/peerOrganizations/org3.example.com/org3.json`);

    console.log('Org3 crypto material and organization definition created successfully.');
}

function setEnvVariables(org) {
    const orgMSP = org === 'Org1' ? 'Org1MSP' : 'Org2MSP';
    const peerAddress = org === 'Org1' ? `localhost:7051` : `localhost:9051`;
    const peerCertFile = org === 'Org1' ? 
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'peers', 'peer0.org1.example.com', 'tls', 'ca.crt') :
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org2.example.com', 'peers', 'peer0.org2.example.com', 'tls', 'ca.crt');
    const peerMSPConfigPath = org === 'Org1' ? 
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org1.example.com', 'users', 'Admin@org1.example.com', 'msp') :
        path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org2.example.com', 'users', 'Admin@org2.example.com', 'msp');

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

function setEnvForOrg3() {
    return {
        ...process.env,
        PATH: `${fabricBinPath}:${process.env.PATH}`,
        FABRIC_CFG_PATH: fabricCfgPath,
        CORE_PEER_LOCALMSPID: 'Org3MSP',
        CORE_PEER_TLS_ROOTCERT_FILE: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org3.example.com', 'peers', 'peer0.org3.example.com', 'tls', 'ca.crt'),
        CORE_PEER_MSPCONFIGPATH: path.join(absolutePathToTestNetwork, 'organizations', 'peerOrganizations', 'org3.example.com', 'users', 'Admin@org3.example.com', 'msp'),
        CORE_PEER_ADDRESS: 'localhost:11051',
        CORE_PEER_TLS_ENABLED: 'true',
    };
}

async function main() {
    try {
        // Create Org3 crypto material and organization definition
        await createOrg3CryptoMaterial();

        execCommand(`docker-compose -f /Users/pouriatayebi/go/src/github.com/pouriata2000/fabric-samples/test-network/addOrg3/compose/docker/docker-compose-org3.yaml up -d`)

        const envOrg1 = setEnvVariables('Org1');
        const envOrg2 = setEnvVariables('Org2');

        // Step 3: Fetch the current channel configuration block
        execCommand(`peer channel fetch config config_block.pb -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, envOrg1);

        // Step 4: Decode the configuration block to JSON
        execCommand(`configtxlator proto_decode --input config_block.pb --type common.Block --output config_block.json`, envOrg1);
        execCommand(`jq .data.data[0].payload.data.config config_block.json > config.json`, envOrg1);

        // Step 5: Modify the configuration to include the new organization
        const configJson = JSON.parse(fs.readFileSync('config.json'));
        const newOrgConfig = JSON.parse(fs.readFileSync(newOrgConfigPath));

        // Add the AnchorPeers to the new organization configuration
        newOrgConfig.values.AnchorPeers = {
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

        configJson.channel_group.groups.Application.groups[newOrgMSP] = newOrgConfig;

        fs.writeFileSync('modified_config.json', JSON.stringify(configJson));

        // Step 6: Encode the original and modified configurations to protobuf
        execCommand(`configtxlator proto_encode --input config.json --type common.Config --output config.pb`, envOrg1);
        execCommand(`configtxlator proto_encode --input modified_config.json --type common.Config --output modified_config.pb`, envOrg1);

        // Step 7: Compute the update configuration
        execCommand(`configtxlator compute_update --channel_id ${channelName} --original config.pb --updated modified_config.pb --output config_update.pb`, envOrg1);

        // Step 8: Decode the update to JSON
        execCommand(`configtxlator proto_decode --input config_update.pb --type common.ConfigUpdate --output config_update.json`, envOrg1);

        // Step 9: Wrap the update in an envelope message
        execCommand(`echo '{"payload":{"header":{"channel_header":{"channel_id":"${channelName}", "type":2}},"data":{"config_update":'$(cat config_update.json)'}}}' | jq . > config_update_in_envelope.json`, envOrg1);

        // Step 10: Encode the envelope message to protobuf
        execCommand(`configtxlator proto_encode --input config_update_in_envelope.json --type common.Envelope --output config_update_in_envelope.pb`, envOrg1);

        // Step 11: Sign the configuration update as Org1
        execCommand(`peer channel signconfigtx -f config_update_in_envelope.pb`, envOrg1);

        // Step 12: Sign the configuration update as Org2
        execCommand(`peer channel signconfigtx -f config_update_in_envelope.pb`, envOrg2);

        // Step 13: Submit the configuration update
        execCommand(`peer channel update -f config_update_in_envelope.pb -c ${channelName} -o ${ordererEndpoint} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, envOrg1);

        // Step 14: Join Org3's peer to the channel
        const envOrg3 = setEnvForOrg3();
        execCommand(`peer channel fetch 0 ${channelName}.block -o ${ordererEndpoint} -c ${channelName} --tls --cafile ${absolutePathToTestNetwork}/organizations/ordererOrganizations/example.com/orderers/orderer.example.com/msp/tlscacerts/tlsca.example.com-cert.pem`, envOrg3);
        execCommand(`peer channel join -b ${channelName}.block`, envOrg3);

        console.log('Organization and anchor peer successfully added to the channel, and Org3 peer has joined the channel.');
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
}

main();

