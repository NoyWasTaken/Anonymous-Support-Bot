const { Permissions } = require("discord.js");

module.exports.run = async(client, message, args) => {
    if(!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
        return message.reply("אין לך גישה לפקודה הזו.");
    
    let ticket = client.serversData[message.member.guild.id][parseInt(args[0])]
    if(ticket)
    {
        let name = "User Not Found";
        let user = client.users.cache.find(u => u.id == ticket);

        if(user)
            name = `${user.username}#${user.discriminator}`;

        return message.reply(`||${name} (${ticket})||`);
    }
    else
    {
        return message.reply("לא נמצא טיקט תחת האיידי הזה.");
    }
}

module.exports.config = {
    command: "reveal",
    description: "Reveals the identity of a ticket creator"
}