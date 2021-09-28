const { Permissions, MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

module.exports.run = async (client, message, args) => {
    if(!message.member.permissions.has(Permissions.FLAGS.ADMINISTRATOR))
        return message.channel.send("אין לך גישה לפקודה הזו.");

    const mention = message.mentions.channels.firstKey();
    const channel = message.guild.channels.cache.find(c => c.id == mention);
    if(channel !== undefined)
    {
        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId('create-ticket')
                .setLabel('יצירת טיקט')
                .setStyle('PRIMARY'),
        );

        const embed = new MessageEmbed()
            .setColor(client.settings.panel_color)
            .setTitle("יצירת טיקט")
            .setDescription("ליצירת טיקט אנונימי, לחץ על כפתור היצירה")
        
        channel.send({embeds: [embed], components: [row]});
        message.reply("הפאנל נשלח בהצלחה.");
    }
}

module.exports.config = {
    command: "setup",
    description: "Sends the ticket creation message to mentioned channel"
}