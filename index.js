const settings = require("./includes/config.json");
const serversData = require('./includes/servers.json');
const Discord = require('discord.js');
const { MessageEmbed } = require('discord.js');
const fs = require("fs");

const client = new Discord.Client({ 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'], 
    intents: Object.keys(Discord.Intents.FLAGS)
});


client.serversDataFile = "./includes/servers.json";
client.commands = new Discord.Collection();
client.settings = settings;
client.serversData = serversData;
client.tickets = {}

fs.readdir('./commands/', (err, files) => {
	if(err) console.error(err);
	
	var jsFiles = files.filter(f => f.split('.').pop() === 'js');
	if(jsFiles.length <= 0)
		return console.log("[+] No commands found.");
	else
		console.log(`[+] Found ${jsFiles.length} commands:`);
	
	jsFiles.forEach((f, i) => {
		var cmds = require(`./commands/${f}`);
		console.log(`[+] Loaded command ${f}`);
		
		client.commands.set(cmds.config.command, cmds);
	});
});

fs.readdir('./events/', (err, files) => {
	if(err) console.error(err);
	
	var jsFiles = files.filter(f => f.split('.').pop() === 'js');
	if(jsFiles.length <= 0)
		return console.log("[+] No events found.");
	else
		console.log(`[+] Found ${jsFiles.length} events:`);
	
	jsFiles.forEach((f, i) => {
		var event = require(`./events/${f}`);
		console.log(`[+] Loaded event ${f}`);
		
		client.on(f.split(".")[0], event.bind(null, client));
	});
});

client.on('messageCreate', async message => {
	if(message.guildId == null)
	{
		if(client.tickets[message.author.id])
			client.tickets[message.author.id].channel.send(message.content);
	} else {
		if(!message.channel || !message.member || message.author.bot)
			return;
		
		if(!IsCommand(message))
		{
			var ticket = client.getTicketOfChannel(message.channel.id)
			if(ticket)
			{
				var user = client.users.cache.find(u => u.id == ticket);
				if(user)
					user.send(message.content);
				else
					message.reply("שגיאה בעת איתור המשתמש.");
			}
		} else {
			var cont = message.content.slice(client.settings.prefix.length).split(" "); // removes prefix then giving an array, cont[0] = command. the rest is the args
			var args = cont.slice(1);
			
			var cmd = client.commands.get(cont[0]);
			if(cmd) cmd.run(client, message, args);
		}
	}
});

client.getTicketOfId = (id) => {
	var ticketId = null;

	for(const [key, value] of Object.entries(client.tickets))
	{
		if(value.id == id)
		{
			ticketId = key;
			break;
		}
	}

	return ticketId;
}

client.getTicketOfChannel = (id) => {
	var ticketId = null;

	for(const [key, value] of Object.entries(client.tickets))
	{
		if(value.channel.id == id)
		{
			ticketId = key;
			break;
		}
	}

	return ticketId;
}

client.isSupporter = (guild, member) => {
	return hasOneOfRoles(guild, member, client.settings.supporters_ranks);
}

client.isInspector = (guild, member) => {
	return hasOneOfRoles(guild, member, client.settings.inspectors_ranks);
}

client.isManager = (guild, member) => {
	return hasOneOfRoles(guild, member, client.settings.managers_ranks);
}

function hasOneOfRoles(guild, member, roles)
{
	var found = false;
	roles.forEach(rank => {
		var role = guild.roles.cache.find(r => r.name == rank)
		if(role !== undefined && member.roles.cache.find(r => r.id == role.id) !== undefined)
			found = true;
	});

	return found;
}

client.rolesToString = (guild, roles) => {
	var mentions = "";

	roles.forEach(rank => {
		var role = guild.roles.cache.find(r => r.name == rank)
		if(role !== undefined)
			mentions = mentions + role.toString();
	})

	return mentions;
}

function IsCommand(message) {
	return message.content.toLowerCase().startsWith(client.settings.prefix);
}

client.logChannel = (guild, channel, file, ticket) => {
	let messageLog = '\
	<div class="parent-container">\
		<div class="avatar-container"><img src="{avatar}" class="avatar"></div>\
		<div class="message-container"><span>{username} {date}</span><span>{message}</span></div>\
	</div>';

	channel.messages.fetch(undefined, {
		cache: false,
		force: true
	}).then(messages => {
		fs.copyFile("log-template.html", file, function(err) {
			if(err) console.log(err);
		});

		fs.readFile(file, "utf8", function (err, data) {
			if(err) return console.log(err);

			let result = data.replace("{guild_name}", guild.name);
			result = result.replace("{guild_avatar}", guild.iconURL());
			result = result.replace("{channel_name}", channel.name);
			result = result.replace("{message_count}", messages.size);
			
			let sortedMessages = [];
			messages.forEach(message => {
				let currentMsg = messageLog;
				currentMsg = currentMsg.replace("{avatar}", message.author.avatarURL());
				currentMsg = currentMsg.replace("{username}", `${message.member.user.username}#${message.member.user.discriminator}`);
				currentMsg = currentMsg.replace("{message}", message.content);
				currentMsg = currentMsg.replace("{date}", message.createdAt);
				
				sortedMessages.push(currentMsg);
			});

			sortedMessages.reverse().forEach(message => {
				result = result + message;
			});

			fs.writeFile(file, result, function(err) {
				if(err) console.log(err);
			});

			let logsChannel = guild.channels.cache.find(c => c.id == client.settings.logs_channel);
			if(logsChannel)
			{
				const promise = fs.promises.readFile(file);
				Promise.resolve(promise).then(function(buffer) {
					let manager = client.users.cache.find(u => u.id == ticket.manager);
					let managerName = manager ? `${manager.username}#${manager.discriminator}` : "לא נמצא תומך";

					const embed = new MessageEmbed()
						.setColor(client.settings.panel_color)
						.setTitle(`צ'אט ${ticket.id}`)
						.setDescription(`תומך: ${managerName}`)

					logsChannel.send({embeds: [embed], files: [{
						attachment: buffer,
						name: file
					}]});
				});

				fs.unlink(file, function(err) {
					if(err) console.log(err);
				});

				channel.delete();
			} else {
				channel.send("שגיאה בעת יצירת לוג לטיקט: חדר הלוגים לא נמצא");
			}
		})
	})
}

console.log(`[+] Logining in using token: ${client.settings.token}`);
console.log(`[+] Using command prefix: ${client.settings.prefix}`);
client.login(client.settings.token);