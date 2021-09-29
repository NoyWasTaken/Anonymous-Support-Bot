const settings = require("./includes/config.json");
const Discord = require('discord.js');
const fs = require("fs");

const client = new Discord.Client({ 
    partials: ['MESSAGE', 'CHANNEL', 'REACTION'], 
    intents: Object.keys(Discord.Intents.FLAGS)
});


client.commands = new Discord.Collection();
client.settings = settings;
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
			client.tickets[message.author.id].channel.send(`הודעה מהמשתמש: **${message.content}**`);
	} else {
		if(!message.channel || !message.member || message.author.bot)
			return;
		
		if(!IsCommand(message))
		{
			for(const [key, value] of Object.entries(client.tickets))
			{
				if(value.channel.id == message.channel.id)
				{
					var user = client.users.cache.find(u => u.id == key);
					if(user)
						user.send(`הודעה מעת צוות התומכים: **${message.content}**`);
					else
						message.reply("שגיאה בעת איתור המשתמש.");

					break;
				}
			}
		} else {
			var cont = message.content.slice(client.settings.prefix.length).split(" "); // removes prefix then giving an array, cont[0] = command. the rest is the args
			var args = cont.slice(1);
			
			var cmd = client.commands.get(cont[0]);
			if(cmd) cmd.run(client, message, args);
		}
	}
});

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

console.log(`[+] Logining in using token: ${client.settings.token}`);
console.log(`[+] Using command prefix: ${client.settings.prefix}`);
client.login(client.settings.token);