import { create, decode } from "https://deno.land/x/djwt@v2.8/mod.ts";

export class TokenManager {
    private tokens: string[] = [];
    private metaData: v = {};
    private crypto_key: CryptoKey;

    constructor(crypto_key: CryptoKey) {
        this.crypto_key = crypto_key;
    }

    async createToken(guild_id: string, auth_id: string): Promise<string> {
        const jwt = await create({alg: 'HS512', typ: 'JWT'}, {guild_id, auth_id}, this.crypto_key);

        this.tokens.push(jwt);
        this.metaData[jwt] = {
            access_level: 1,
            expire_after: Date.now() + 600000, // 10 mins?
            permitted_endpoints: ['POST /auth']
        }

        return jwt;
    }

    async deleteToken(token: string): Promise<void> {
        const index = this.tokens.indexOf(token);
        this.tokens.splice(index, 1);
        await new Promise((resolve) => {resolve(1)});
    }

    decodeToken(token: string) {
        return decode(token);
    }
}

export async function TokenManagerCreator(): Promise<TokenManager> {
    const crypto_key = await crypto.subtle.generateKey(
        {name: 'HMAC', hash: 'SHA-512'},
        true,
        ["sign", "verify"]
    );

    return new TokenManager(crypto_key);
}

interface v {
    [key: string]: {
        access_level: number;
        expire_after: number;
        permitted_endpoints: string[];
        oauth?: string;
        ocode?: string;
    };
}