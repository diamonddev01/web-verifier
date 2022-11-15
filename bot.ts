import { GatewayIntents, CommandClient, Command, CommandContext } from "https://deno.land/x/harmony@v2.6.0/mod.ts";
import {config as loadENV} from "https://deno.land/x/dotenv@v3.2.0/mod.ts";

loadENV({
    export: true
})

export const client = new CommandClient({
    intents: [GatewayIntents.GUILDS, GatewayIntents.GUILD_MESSAGES, GatewayIntents.GUILD_MEMBERS],
    token: Deno.env.get("DISCORD_TOKEN"),
    prefix: '>'
});

client.on('ready', () => {
    console.log('Ready!');
});

class VerifyCommand extends Command {
    name = 'verify';

    async execute(ctx: CommandContext) {
        // Get the verified role of the server
        const Ver_Role = Deno.env.get('VERIFIED_ROLE');
        if(!ctx.member || !ctx.guild) return;

        const member = await ctx.guild.members.fetch(ctx.member.id);

        if(!Ver_Role) return;

        if(member.roles.get(Ver_Role) !== undefined) return ctx.message.channel.send({content: 'You are already verified'}).catch();

        return ctx.message.channel.send({content: `You can verify at http://localhost:8080/auth?guild_id=${ctx.guild.id}&auth_id=${ctx.author.id}`}).catch();
    }
}

client.commands.add(VerifyCommand);