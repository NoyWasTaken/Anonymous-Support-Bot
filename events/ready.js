const {Permissions} = require("discord.js")

module.exports = async (client) => {
    console.log(`[+] Bot is ready! Username: ${client.user.username}#${client.user.discriminator}`);

    const link = client.generateInvite({
        permissions: [Permissions.FLAGS.ADMINISTRATOR],
        scopes: ['bot']
	});
    
    console.log(`[+] Generated invite url: ${link}`);

    const guilds = client.guilds.cache;
    guilds.forEach(guild => {
        client.tickets[guild.id] = {}
    });
}