module.exports.run = async(client, message) => {
    if(!client.isInspector(message.guild, message.member) && !client.isManager(message.guild, message.member))
        return message.reply("אין לך גישה לפקודה הזו.");

        var mention = message.mentions.channels.firstKey();
        const channel = message.guild.channels.cache.find(c => c.id == mention);
        if(channel !== undefined)
        {
            var ticket = client.getTicketOfChannel(channel.id);
            if(ticket != null)
            {
                mention = message.mentions.users.firstKey();
                var user = message.guild.members.cache.find(u => u.id == mention)
                if(user !== undefined)
                {
                    channel.permissionOverwrites.create(user, {
                        SEND_MESSAGES: false
                    })
                    
                    channel.send(`${user.toString()} הוסר מצ'אט התמיכה.`);
                } else {
                    return message.reply("לא נמצא משתמש תחת התיוג.");
                }
            } else {
                return message.reply("לא נמצא צ'אט תמיכה תחת החדר שתוייג.");
            }
        } else {
            return message.reply("לא נמצא צ'אט תחת החדר שתוייג.");
        }
}  

module.exports.config = {
    command: "remove",
    description: "Removes a supporter from a ticket"
}