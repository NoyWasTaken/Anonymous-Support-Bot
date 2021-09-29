const { Permissions } = require("discord.js");

module.exports.run = async(client, message) => {
    if(!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
        return message.reply("אין לך גישה לפקודה הזו.");

    const mention = message.mentions.channels.firstKey();
    const channel = message.guild.channels.cache.find(c => c.id == mention);
    if(channel !== undefined)
    {
        var ticket = client.getTicketOfChannel(channel.id);
        if(ticket == null)
            return message.reply("לא נמצא צ'אט תחת החדר שתוייג.");

        var user = client.users.cache.find(u => u.id == ticket);
        if(user)
            return message.reply(`יוצר הצ'אט: ${user.toString()} - ${user.username}#${user.discriminator}`);
    } else {
        return message.reply("לא נמצא צ'אט תחת התיוג הזה.");
    }
}

module.exports.config = {
    command: "reveal",
    description: "Reveals the identity of a ticket creator"
}