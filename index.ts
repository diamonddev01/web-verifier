import {opine, json as bparser_json, urlencoded as bparser_urlencoded} from "https://deno.land/x/opine@2.3.3/mod.ts";
import {resolve} from "https://deno.land/std@0.66.0/path/mod.ts";
import {config as loadENV} from "https://deno.land/x/dotenv@v3.2.0/mod.ts";
import { TokenManagerCreator } from "./tokenManager.ts";
import { getCookies } from "https://deno.land/std@0.153.0/http/cookie.ts";
import {client} from './bot.ts';
import { ChannelTypes, GuildTextBasedChannel } from "https://deno.land/x/harmony@v2.6.0/mod.ts";

loadENV({
    export: true
});

const tokenManager = await TokenManagerCreator();

const app = opine();

app.use(bparser_json());
app.use(bparser_urlencoded({extended: true}));

app.get('/auth', (request, response) => {
    const guild_id = request.query.guild_id;
    const auth_id = request.query.auth_id;

    if(!guild_id || !auth_id) {
        response.setStatus(400).sendFile(resolve('./public/400.html'));
        return;
    }

    //response.sendStatus(200).render('./public/index.html');
    response.setStatus(200).sendFile(resolve('./public/index.html'));
});

app.get('/prep_auth', (_request, response) => {
    const response_url = 'https://discord.com/api/oauth2/authorize?client_id=993282854710694040&redirect_uri=http%3A%2F%2Flocalhost%3A8080%2Fauth_response&response_type=code&scope=identify';
    response.redirect(response_url);
});
app.get('/auth_response', async (request, response) => {
    const code = request.query.code;
    if(!code) {
        response.setStatus(400).sendFile(resolve('./public/400.html'));
        return;
    }

    // Make request to get BEARER code
    const tkn = await bearer(code);
    console.log(tkn);

    if(!tkn) {
        response.setStatus(401).sendFile(resolve('./public/401.html'));
        return;
    }

    const user = await get_user(tkn);
    console.log(user);
    response.setStatus(200).redirect(`./sign_in?id=${user?.id}&username=${user?.username}`)
});

app.get('/sign_in', (request, response) => {
    const id = request.query.id;

    if(!id) {
        response.setStatus(400).sendFile(resolve('./public/400.html'));
        return;
    }

    const cookies = getCookies(request.headers);
    if(!cookies) {
        response.redirect('./auth');
        return;
    }

    //parse jwt
    const jwt = cookies['jwt'];
    const [_header, payload, _signature] = tokenManager.decodeToken(jwt);
    // deno-lint-ignore no-explicit-any
    if(!(payload as unknown as any).auth_id == id) {
        response.setStatus(401).sendFile(resolve('./public/401.html'));
        return;
    }

    response.sendFile(resolve('./public/signed_in.html'));
    addRoles((payload as unknown as any).guild_id, id, Deno.env.get('VERIFIED_ROLE') as string);
})

app.post('/auth/create_token', async (request, response) => {
    // Use body
    console.log(request.body);

    let body;
    if(typeof request.body == "string") {
        body = JSON.parse(request.body);
    } else {
        body = request.body;
    }

    const guild_id = body.guild_id;
    const auth_id = body.auth_id;

    if(!guild_id || !auth_id) {
        response.setStatus(400).send(JSON.stringify({code: 400, TYPE: 'BAD REQUEST'}));
        //response.setStatus(400).render('./public/401.html');
        return;
    }

    //response.sendStatus(200).render('./public/index.html');
    response.setStatus(200).send(await tokenManager.createToken(guild_id, auth_id));
});

app.listen(8080);
client.connect();

function bearer(code: string): Promise<string|null> {
    return new Promise((resolve) => {
        fetch('https://discord.com/api/v10/oauth2/token', {
            method: 'POST',
            body: `client_id=${Deno.env.get('CLIENT_ID')}&client_secret=${Deno.env.get('CLIENT_SECRET')}&grant_type=authorization_code&code=${code}&redirect_uri=${Deno.env.get('URL_ENCODED_REDIRECT_URI')}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        }).then(async (data) => {
            const json = await data.json();
            resolve(json.token_type + ' ' + json.access_token);
        }).catch((e) => {
            console.log(e);
            resolve(null);
        })
    })
}

function get_user(auth: string): Promise<{id: string, username: string}|null> {
    return new Promise((resolve) => {
        fetch('https://discord.com/api/v10/users/@me', {
            method: 'GET',
            headers: {
                'Authorization': auth
            }
        }).then(async (data) => {
            const json = await data.json();
            console.log(json);
            resolve({
                id: json.id,
                username: json.username
            })
        }).catch((e) => {
            console.log(e);
            resolve(null);
        })
    })
}

function addRoles(guild_id: string, user_id: string, role_id: string): void {
    fetch(`https://discord.com/api/v10/guilds/${guild_id}/members/${user_id}/roles/${role_id}`, {
        method: 'PUT',
        headers: {
            'Authorization': 'Bot ' + Deno.env.get('DISCORD_TOKEN') as string,
            'X-Audit-Log-Reason': 'Verified'
        }
    }).catch();
}
