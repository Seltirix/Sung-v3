const emojis = require('../../emojis');

module.exports.run = async (client, message, args, data) => {
    if(!args.length) {
        const cData = (await require('../../models/Command').find({ guildID: message.guild.id })).filter((command) => command.public && command.enabled);
        const categories = [];

        client.commands.forEach((command) => {
            if(!categories.includes(command.help.category)) {
                if(command.help.category === "Owner") return;
                categories.push(command.help.category);
            }
        });

        const embed = {
            color: client.config.embed.color,
            title: `📚 - Commandes de ${client.user.username}`,
            description: '\u200b',
            fields: [],
            footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
        };

        categories.sort().forEach((category) => {
            const tCommands = client.commands.filter(cmd => cmd.help.category === category);
            embed.fields.push({ name: `${emojis.categories[category]}  ${category} - ${tCommands.size}`, value: tCommands.map((cmd) => `\`${cmd.help.name}\``).join(', ') });
        });

        if(cData.length >= 1) {
            embed.fields.push({ name: `⚙️  Commandes personnalisées - ${cData.length}`, value: cData.map((command) => `\`${command.name}\``).join(', ') });
        }

        embed.fields.push({ name: '🔗  Liens', value: '[Inviter le bot](https://discord.com/oauth2/authorize?client_id=781911855299035217&scope=bot&permissions=2147483647) • [Voter pour le bot](https://top.gg/bot/781911855299035217) • [Serveur support](https://discord.gg/SSWQamBCFE)' });

        return message.channel.send({ embed });
    } else {
        const command = client.commands.get(args[0].toLowerCase()) || client.commands.find((cmd) => cmd.help.aliases && cmd.help.aliases.includes(args[0]));
        if(!command) return message.channel.send(`⚠️ Cette commande n'existe pas, vérifiez l'orthographe et réessayez.`);

        return message.channel.send({
            embed: {
                color: client.config.embed.color,
                title: `📚 Help - ${command.help.name}`,
                description: '<> ➔ champ obligatoire \n[] ➔ champ facultatif',
                fields: [
                    {
                        name: 'Description',
                        value: command.help.description
                    },
                    {
                        name: 'Utilisation',
                        value: command.help.usage ? `${data.prefix + command.help.name} ${command.help.usage}` : data.prefix + command.help.name
                    },
                    {
                        name: 'Aliases',
                        value: command.help.aliases.length > 1 ? command.help.aliases.map((a) => `\`${a}\``).join(', ') : 'Aucun alias'
                    },
                    {
                        name: 'Cooldown',
                        value: command.help.cooldown + ' secondes'
                    },
                    {
                        name: 'Permissions',
                        value: `**Bot**: ${command.help.botPerms.length > 0 ? client.formatPermissions(command.help.botPerms.map((p) => `\`${p}\``).join(', ')) : 'Pas de permission requise'} \n**Membres**: ${command.help.memberPerms.length > 0 ? client.formatPermissions(command.help.memberPerms.map((p) => `\`${p}\``).join(', ')) : 'Aucune permission requise'}`
                    },
                ],
                footer: { text: client.config.embed.footer, value: client.user.displayAvatarURL() }
            }    
        });
    }
}

module.exports.help = {
    name: "help",
    aliases: ["help", "aide", "h", "commands", "commandes"],
    category: "General",
    description: "Afficher toutes les commandes disponibles.",
    usage: "[commande]",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
