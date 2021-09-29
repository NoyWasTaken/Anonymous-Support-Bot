const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const wait = require('util').promisify(setTimeout);

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    
    if(interaction.customId == "create-ticket")
    {
        interaction.deferUpdate();

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

            var permissions = [
                {
                    id: interaction.guild.roles.everyone,
                    deny: ["VIEW_CHANNEL", "SEND_MESSAGES"]
                }
            ]

            var totalRanks = client.settings.supporters_ranks.concat(client.settings.inspectors_ranks).concat(client.settings.managers_ranks)
            totalRanks.forEach(rank => {
                var role = interaction.guild.roles.cache.find(r => r.name == rank)
                if(role)
                {
                    permissions.push(
                        {
                            id: role.id,
                            allow: ["VIEW_CHANNEL", "READ_MESSAGE_HISTORY"],
                            deny: ["SEND_MESSAGES"]
                        }
                    )
                }
            });

            var tickets = interaction.guild.channels.cache.find(c => c.type == "GUILD_CATEGORY" && c.name == client.settings.tickets_category)
            interaction.guild.channels.create(`צאט-${id}`, {
                type: "text",
                parent: tickets.id,
                permissionOverwrites: permissions
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
                    .setTitle(`צ'אט ${id}`)
                    .setDescription("משתמש פתח צ'אט, נא לתת סיוע בהתאם!")
                
                channel.send({embeds: [embed], components: [row]});
                channel.send(client.rolesToString(interaction.guild, client.settings.supporters_ranks.concat(client.settings.inspectors_ranks)))
            })

            interaction.member.send("היי, צוות התומכים קיבל את הודעתכם בהצלחה!\nכל הודעה שתשלח כאן תגיע באופן אנונימי לצוות התומכים.");
        }
    } else if (interaction.customId.includes("take-ticket-")) {
        if(!client.isSupporter(interaction.guild, interaction.member) && !client.isInspector(interaction.guild, interaction.member) && !client.isManager(interaction.guild, interaction.member))
            return interaction.member.send("אין לך גישה לקחת את הצ'אט.");

        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`take-ticket-${interaction.member.id}`)
                .setLabel("שיוך צ'אט אליי")
                .setStyle('PRIMARY')
                .setDisabled(true),

                new MessageButton()
                .setCustomId(`close-ticket-${interaction.member.id}`)
                .setLabel("סגירת צ'אט")
                .setStyle('DANGER'),
        );

        interaction.update({
            components: [
                row
            ]
        });

        var userId = interaction.customId.replace("take-ticket-", "");
        if(client.tickets[userId].manager != null)
            return interaction.member.send("הצ'אט כבר נלקח ע\"י חבר צוות אחר.");

        client.tickets[userId].manager = interaction.member.id;
        client.tickets[userId].channel.send(`הצ'אט נלקח ע"י חבר הצוות ${interaction.member.toString()}`)
        
        client.tickets[userId].channel.permissionOverwrites.create(interaction.member, {
            SEND_MESSAGES: true
        })
    } else if (interaction.customId.includes("close-ticket-")) {
        if(!client.isSupporter(interaction.guild, interaction.member) && !client.isInspector(interaction.guild, interaction.member) && !client.isManager(interaction.guild, interaction.member))
            return interaction.member.send("אין לך גישה לסגור את הצ'אט.");

        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`take-ticket-${interaction.member.id}`)
                .setLabel("שיוך צ'אט אליי")
                .setStyle('PRIMARY')
                .setDisabled(true),

                new MessageButton()
                .setCustomId(`close-ticket-${interaction.member.id}`)
                .setLabel("סגירת צ'אט")
                .setStyle('DANGER')
                .setDisabled(true),
        );

        interaction.update({
            components: [
                row
            ]
        });

        var userId = interaction.customId.replace("close-ticket-", "");
        var user = client.users.cache.find(u => u.id == userId);

        if(user)
        {
            user.send("הצ'אט נסגר ע\"י הצוות.");
            client.tickets[userId].channel.send(`הצ'אט נסגר ע "י חבר הצוות ${interaction.member.toString()}`);
        }
        else
            client.tickets[userId].channel.send("לא ניתן לאתר את יוצר הטיקט.");

        delete client.tickets[userId];

        // TODO: save log of the ticket
    }
}