const { MessageEmbed } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    const user = message.mentions.users.first() || client.users.cache.get(args[0]);

    if(!user || !message.guild.member(user)) return message.channel.send('⚠️ Cet utilisateur n\'existe pas !');
    
    const dbUser = await client.findOrCreateUser(user);

    if(user.id == message.author.id) return message.channel.send(`⚠️ Vous ne pouvez pas clear vos warns ${require('../../emojis').facepalm}`);

    if(!dbUser || dbUser?.warns?.length < 1) return message.channel.send('❌ Cet utilisateur n\'a aucun avertissement sur le serveur.');

    dbUser.warns = [];
    dbUser.markModified("warns");
    dbUser.save();

    message.channel.send(`✅ ${message.author} a retiré tous les avertissements de ${user}`);

    if(data.plugins.logs.enabled) {
        if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
            const embed = new MessageEmbed()
                .setColor('ORANGE')
                .setDescription(`Les warns de **${user.username}** ont été clear par ${message.author}.`)
                .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
            message.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
        }
    }
}

module.exports.help = {
    name: "clearwarns",
    aliases: ["clearwarns", "clear-warns", "cw"],
    category: "Moderation",
    description: "Supprimer tous les warns d'un membre du serveur",
    usage: "<membre>",
    cooldown: 5,
    memberPerms: ["MANAGE_MESSAGES"],
    botPerms: [],
    args: true
}
