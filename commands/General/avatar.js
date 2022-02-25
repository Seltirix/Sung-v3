module.exports.run = async (client, message, args) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find((u) => u.username.toLowerCase().includes(args[0]?.toLowerCase())) || message.author;

    if(!message.guild.member(user)) return message.channel.send('⚠️ Cette personne n\'est pas sur le serveur!');

	message.channel.send({ 
        embed: {
            color: message.guild.member(user).displayHexColor,
            title: `Avatar de ${user.username}`,
		    image: {
			    url: user.displayAvatarURL({ size: 512, dynamic: true })
		    }
        }
    });
}

module.exports.help = {
    name: "avatar",
    aliases: ["avatar", "pp", "pdp"],
    category: "General",
    description: "Voir l'avatar d'un utilisateur",
    usage: "[utilisateur]",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
