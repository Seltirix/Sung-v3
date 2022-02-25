const moment = require('moment');
const emojis = require('../../emojis');

module.exports.run = async (client, message, args) => {
	let user;

	if(!args.length) {
		user = message.author;
	} else {
		user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(u => u.username.toLowerCase().includes(args[0].toLowerCase()));
	};

	if(!user || !message.guild.member(user)) return message.channel.send('⚠️ Cet utilisateur n\'existe pas !');

    const member = message.guild.member(user);

    let clientStatus = user.presence.clientStatus;

    if(clientStatus === null) clientStatus = 'Inconnu';
    if(clientStatus.desktop) clientStatus = 'Ordinateur';
    else if(clientStatus.web) clientStatus = 'Web';
    else if(clientStatus.mobile) clientStatus = 'Téléphone';
    else clientStatus = "Inconnu";

    const roles = member.roles.cache.sort((a, b) => b.position - a.position).filter(role => role.id !== message.guild.roles.everyone.id).map(role => role.toString());
    let reste = roles.splice(0, 29).join(", ");

    if(reste.length > 300) reste = reste.substr(0, 310) + " et plus...";

    let userStatus = user.presence.status;
    switch (userStatus) {
      	case "online": {
        	userStatus = `${emojis.online} En ligne`;
        	break;
      	};
      	case "offline": {
        	userStatus = `${emojis.offline} Hors-ligne`;
        	break;
      	};
      	case "idle": {
        	userStatus = `${emojis.idle} Inactif`;
        	break;
      	};
      	case "dnd": {
        	userStatus = `${emojis.dnd} Ne pas déranger`;
        	break;
      	};
    };

    let userActivity = user.presence.activities[0];
    let toDisplay = "";
    if(userActivity) {
        if(userActivity.name !== "Custom Status") {
            switch (userActivity.type) {
                case "PLAYING": toDisplay = 'Joue à '; break;
                case "LISTENING": toDisplay = 'Écoute '; break;
                case "WATCHING": toDisplay = 'Regarde '; break;
                case "COMPETING": toDisplay = 'Participant à: '; break;
                case "STREAMING": toDisplay = 'Streame '; break;
            };

            toDisplay+= userActivity.name;
        } else {
            toDisplay = `${userActivity.emoji ? userActivity.emoji : ""} ${userActivity.state ? userActivity.state : ""}`
        }
    }

    message.channel.send({ 
        embed: {
            color: client.config.embed.color,
            author: {
                name: user.tag,
                icon_url: user.displayAvatarURL()
            },
            thumbnail: {
                url: user.displayAvatarURL({ dynamic: true })
            },
            fields: [
                {
                    name: "__Infos utilisateur__",
                    value: `⭐ **Nom d'utilisateur :** ${user.username}\n🤖 **Bot ? :** ${user.bot ? "Oui" : "Non"}\n🔋 **ID utilisateur :** ${user.id}\n⏳ **Création du compte :** ${moment(user.createdAt).locale('fr').format('llll')}`
                },
                {
                    name: "__Statut utilisateur__",
                    value: `📱 **Activité :** ${toDisplay.length > 1 ? toDisplay : "Aucune activité en cours"}\n🖥️ **Client :** ${clientStatus}\n📡 **Status :** ${userStatus}`
                },
                {
                    name: "__Infos du membre sur le serveur__",
                    value: `📥 **Rejoint le :** ${moment(member.joinedAt).locale('fr').format('llll')}\n🎭 **Rôles :** ${member.roles.cache.size > 1 ? reste : "Aucun rôle"}`
                }
            ],
            footer: {
                text: client.config.embed.footer,
                icon_url: client.user.displayAvatarURL()
            }
        } 
    });
}

module.exports.help = {
    name: "userinfo",
    aliases: ["userinfo", "ui", "userinfos", "infouser", "infosuser", "user-info", "user-infos", "info-user", "infos-user"],
    category: "General",
    description: "Afficher des informations sur un membre ou vous même",
    usage: "[membre]",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
