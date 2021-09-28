module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    
    if(interaction.customId == "create-ticket")
    {
        if(client.tickets[interaction.guildId][interaction.member.id])
        {
            interaction.member.send("כבר יש לך טיקט פתוח, שלח הודעה בצ'אט כאן והיא תעבור באופן אנונימי לצוות התומכים.")
        } else {
            var keys = Object.keys(client.tickets[interaction.guildId])
            var id = keys.length == 0 ? 1 : client.tickets[interaction.guildId][keys[keys.length - 1]].id + 1

            client.tickets[interaction.guildId][interaction.member.id] = {
                id: id,
                manager: null
            }

            var tickets = interaction.guild.channels.cache.find(c => c.type == "GUILD_CATEGORY" && c.name == client.settings.tickets_category)
            interaction.guild.channels.create(`צאט-${id}`, {
                type: "text",
                parent: tickets.id
            })

            interaction.member.send("היי, צוות התומכים קיבל את הודעתכם בהצלחה!\nכל הודעה שתשלח כאן תגיע באופן אנונימי לצוות התומכים.");
        }
    }
}