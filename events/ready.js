module.exports = async (client) => {
    console.log(`[+] Bot is ready! Username: ${client.user.username}#${client.user.discriminator}`);

    client.generateInvite({
		permissions: [ 'ADMINISTRATOR'],
	}).then(link => {
        console.log(`[+] Generated an invitation link: ${link}`);
    }).catch(err => {
        console.log(`[+] Error while trying to create an invitation link: ${error.stack}`);
    });
}