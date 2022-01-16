const { MessageActionRow, MessageButton, MessageEmbed } = require("discord.js");
const fs = require("fs");

module.exports = async (client, interaction) => {
    if (!interaction.isButton()) return;
    
    if(interaction.customId == "create-ticket")
    {
        interaction.deferUpdate();

        if(client.tickets[interaction.member.id])
        {
            interaction.member.send("כבר יש לך טיקט פתוח, שלח הודעה בצ'אט כאן והיא תעבור באופן אנונימי לצוות התומכים.")
        } else {
            if(!client.serversData[interaction.guild.id])
                client.serversData[interaction.guild.id] = { "tickets_count": 0 }

            /*var keys = Object.keys(client.tickets)
            var id = keys.length == 0 ? 1 : client.tickets[keys[keys.length - 1]].id + 1*/
            client.serversData[interaction.guild.id]["tickets_count"]++;
            var id = client.serversData[interaction.guild.id]["tickets_count"];
            client.serversData[interaction.guild.id][id] = interaction.member.id;

            fs.writeFile(client.serversDataFile, JSON.stringify(client.serversData, null, 2), function(err) {
            });

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
                        .setCustomId(`close-ticket-${interaction.member.id}`)
                        .setLabel("סגירת צ'אט")
                        .setStyle('DANGER'),

                    new MessageButton()
                        .setCustomId(`take-ticket-${interaction.member.id}`)
                        .setLabel("שיוך צ'אט אליי")
                        .setStyle('PRIMARY'),
                );

                const embed = new MessageEmbed()
                    .setColor(client.settings.panel_color)
                    .setTitle(`צ'אט ${id}`)
                    .setDescription("משתמש פתח צ'אט, נא לתת סיוע בהתאם!")
                
                channel.send({embeds: [embed], components: [row]});
                channel.send(client.rolesToString(interaction.guild, client.settings.supporters_ranks.concat(client.settings.inspectors_ranks))).then(msg => {
                    msg.delete();
                })
            })
            
            const embed = new MessageEmbed()
                    .setColor(client.settings.panel_color)
                    .setTitle(`צ'אט ${id}`)
                    .setDescription("היי, צוות התומכים קיבל את הודעתכם בהצלחה!\nכל הודעה שתשלח כאן תגיע באופן אנונימי לצוות התומכים.")

            interaction.member.send({embeds: [embed]});
        }
    } else if (interaction.customId.includes("take-ticket-")) {
        if(!client.isSupporter(interaction.guild, interaction.member) && !client.isInspector(interaction.guild, interaction.member) && !client.isManager(interaction.guild, interaction.member))
            return interaction.member.send("אין לך גישה לקחת את הצ'אט.");

        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
                .setCustomId(`close-ticket-${interaction.member.id}`)
                .setLabel("סגירת צ'אט")
                .setStyle('DANGER'),

            new MessageButton()
                .setCustomId(`take-ticket-${interaction.member.id}`)
                .setLabel("שיוך צ'אט אליי")
                .setStyle('PRIMARY')
                .setDisabled(true),
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
                .setCustomId(`close-ticket-${interaction.member.id}`)
                .setLabel("סגירת צ'אט")
                .setStyle('DANGER')
                .setDisabled(true),

            new MessageButton()
                .setCustomId(`take-ticket-${interaction.member.id}`)
                .setLabel("שיוך צ'אט אליי")
                .setStyle('PRIMARY')
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
            const embed = new MessageEmbed()
                .setColor(client.settings.panel_color)
                .setTitle(`הצ'אט נסגר`)
                .setDescription("מזמינים אתכם לפנות אלינו שוב בכל עת.\nהמשך יום טוב!")
            
            user.send({embeds: [embed]});
            if(client.tickets[userId] && client.tickets[userId].channel)
            {
                client.logChannel(interaction.guild, client.tickets[userId].channel, `ticket-${client.tickets[userId].id}.html`, client.tickets[userId]);
            }
        }
        else
            client.tickets[userId].channel.send("לא ניתן לאתר את יוצר הטיקט.");

        delete client.tickets[userId];
        // TODO: save log of the ticket
    }
}