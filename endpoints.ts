const _endpoints = {
    '/auth': {
        get: {
            require_signin: false,
            require_arguments: {
                guild_id: {
                    type: String,
                    data: "The guild id of the server you are verifying for"
                },
                auth_id: {
                    type: String,
                    data: "Given by the bot to identify this auth"
                }
            }
        },
        post: {
            require_signin: true,
            require_arguments: null,
            signing_data: [
                {
                    type: "TOKEN",
                    header_name: 'Auth',
                    access_level: 1
                },
                {
                    type: "TOKEN",
                    header_name: 'Discord Bearer'
                }
            ]
        }
    }
}

const _auth = {
    1: {
        description: 'A user pending verification',
        endpoints: {
            'POST /auth': "Used to get verified"
        }
    },
    2: {
        description: 'A guild moderator',
        extra: 'When given a 2 permit level, the permitted endpoints will change large amounts',
        endpoints: {
            'GET /guild_id/': "Used to moderate the pending requests"
        }
    },
    3: {
        description: 'The bot & any developers'
    }
}