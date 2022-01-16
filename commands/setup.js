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
                .setLabel("פתיחת צ'אט אנונימי")
                .setStyle('PRIMARY'),
        );
        
        let tosMention = message.mentions.channels.firstKey(2)[1];
        let tosChannel = message.guild.channels.cache.find(c => c.id == tosMention);

        if(tosChannel !== undefined)
        {
            const embed = new MessageEmbed()
                .setColor(client.settings.panel_color)
                .setTitle("אתם לא לבד - דברו איתנו!")
                .setDescription(`על מנת לפתוח צ'אט ולשוחח עם אחד התומכים באופן אנונימי יש ללחוץ על הכפתור מטה, והצ'אט יפתח באופן אוטומטי.\nלאחר פתיחתו תקבלו הודעה פרטית מהבוט האנונימי שלנו כי הצ'אט אכן נפתח.\nבאמצעות ההודעה הפרטית אתם מוזמנים לכתוב לנו ולפרוק בחופשיות את כל מה שעל ליבכם, ונשמח להעניק לכם אוזן קשבת ומענה חם ואוהב בחזרה.\nשימו לב שיש לקרוא את תנאי השימוש בקפידה לפני שימושכם בשרת ובצ'אטים (${tosChannel.toString()}).`)
            
            channel.send({embeds: [embed], components: [row]});
            message.reply("הפאנל נשלח בהצלחה.");
        }
    }
}

module.exports.config = {
    command: "setup",
    description: "Sends the ticket creation message to mentioned channel"
}