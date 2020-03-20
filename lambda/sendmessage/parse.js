const { messageConnectionList } = require('/opt/sockets')
const { getRoom } = require('/opt/rooms')

const { TABLE_PREFIX } = process.env;
const connectionTable = `${TABLE_PREFIX}_connections`
const roomTable = `${TABLE_PREFIX}_rooms`


const parseCommand = async ({
    name,
    message,
    roomData,
    dbh,
    gatewayAPI,
    connectionId
}) => {
    const exits = (roomData && roomData.exits) || []
    const strippedMessage = message.trim()
    const firstMatchedExit = exits.filter(({ exitName }) => (exitName === strippedMessage))
    if (firstMatchedExit.length) {
        const { toRoomId, exitName } = firstMatchedExit[0]
        const connectionPutParams = {
            TableName: connectionTable,
            Item: {
                connectionId: connectionId,
                name,
                roomId: toRoomId
            }
        };
        const roomPutParamsOne = {
            TableName: roomTable,
            Item: {
                ...roomData,
                players: roomData.players.filter((player) => (player.connectionId !== connectionId))
            }
        }
    
        try {
            await messageConnectionList({
                connections: roomData.players.map(({ connectionId }) => (connectionId)),
                gatewayAPI,
                dbh,
                postData: JSON.stringify({
                    type: 'sendmessage',
                    name: '',
                    protocol: 'worldMessage',
                    message: `${name} has taken the ${exitName} exit.`
                })
            })
            let toRoomData = await dbh.getRoom(toRoomId)
            toRoomData = toRoomData.Item
            const roomPutParamsTwo = {
                TableName: roomTable,
                Item: {
                    ...toRoomData,
                    players: [
                        ...(toRoomData.players || []),
                        {
                            name,
                            connectionId
                        }
                    ]
                }    
            }
            await Promise.all([
                dbh.put(connectionPutParams),
                dbh.put(roomPutParamsOne),
                dbh.put(roomPutParamsTwo)
            ])
            await messageConnectionList({
                connections: [
                    ...(toRoomData.players.map(({ connectionId }) => (connectionId))),
                    connectionId
                ],
                gatewayAPI,
                dbh,
                postData: JSON.stringify({
                    type: 'sendmessage',
                    name: '',
                    protocol: 'worldMessage',
                    message: `${name} has arrived.`
                })
            })
        } catch (err) {
            return { statusCode: 500, body: 'Failed to connect: ' + JSON.stringify(err) };
        }
        
        return true
    }
    return false
}

exports.parseCommand = parseCommand