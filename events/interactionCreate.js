const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    
    if(interaction.customId == "create-ticket")
    {
        if(client.tickets[interaction.member.id])
        {
            interaction.member.send("כבר יש לך טיקט פתוח, שלח הודעה בצ'אט כאן והיא תעבור באופן אנונימי לצוות התומכים.")
        } else {
            var keys = Object.keys(client.tickets)
            var id = keys.length == 0 ? 1 : client.tickets[keys[keys.length - 1]].id + 1

            client.tickets[interaction.member.id] = {
                id: id,
                manager: null
            }

            var tickets = interaction.guild.channels.cache.find(c => c.type == "GUILD_CATEGORY" && c.name == client.settings.tickets_category)
            interaction.guild.channels.create(`צאט-${id}`, {
                type: "text",
                parent: tickets.id
            }).then(channel => {
                client.tickets[interaction.member.id].channel = channel

                const row = new MessageActionRow()
                .addComponents(
                    new MessageButton()
                        .setCustomId(`take-ticket-${interaction.member.id}`)
                        .setLabel("שיוך צ'אט אליי")
                        .setStyle('PRIMARY'),

                        new MessageButton()
                        .setCustomId(`close-ticket-${interaction.member.id}`)
                        .setLabel("סגירת צ'אט")
                        .setStyle('DANGER'),
                );

                const embed = new MessageEmbed()
                    .setColor(client.settings.panel_color)
                    .setTitle("יצירת טיקט")
                    .setDescription("ליצירת טיקט אנונימי, לחץ על כפתור היצירה")
                
                channel.send({embeds: [embed], components: [row]});
            })

            interaction.member.send("היי, צוות התומכים קיבל את הודעתכם בהצלחה!\nכל הודעה שתשלח כאן תגיע באופן אנונימי לצוות התומכים.");
        }
    } else if (interaction.customId.includes("take-ticket-")) {
        var userId = interaction.customId.replace("take-ticket-", "");
        if(client.tickets[userId].manager != null)
            return interaction.member.send("הצ'אט כבר נלקח ע\"י חבר צוות אחר.");

        client.tickets[userId].manager = interaction.member.id;
        client.tickets[userId].channel.send(`הצ'אט נלקח ע"י חבר הצוות ${interaction.member.toString()}`)
        // update channel permissions
    }
}