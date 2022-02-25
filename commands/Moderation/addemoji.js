module.exports.run = (client, message, args) => {
    const name = args[0];
    if(!name || name.length < 2) return message.channel.send('⚠️ Merci de spécifier un nom valide pour l\'emoji.');

    const url = args[1];
    if(!url) return message.channel.send('⚠️ Merci de spécifier un emoji ou un url.');

    const isEmoji = require('discord.js').Util.parseEmoji(url);
    if(!isEmoji && !/[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)?/gi.test(url)) return message.channel.send('⚠️ Merci donner un emoji ou un url valide.');

    if(isEmoji && isEmoji.id) {
        message.guild.emojis.create(`https://cdn.discordapp.com/emojis/${isEmoji.id}.${isEmoji.animated ? 'gif' : 'png'}`, name)
            .then((emoji) => {
                message.channel.send(`✅ L'emoji ${emoji} (${emoji.name}) a été créé avec succès !`);
            }).catch((err) => {
                if(err.code === 30008) return message.channel.send('❌ Vous avez atteint la limite d\'emojis sur votre serveur !');
                if(err.code === 50035) return message.channel.send('❌ Lien invalide.');
                message.channel.send('❌ Une erreur est survenue.');
                console.error(err);
            });
    } else {
        message.guild.emojis.create(url, name)
            .then((emoji) => {
                message.channel.send(`✅ L'emoji ${emoji} (${emoji.name}) a été créé avec succès !`);
            }).catch((err) => {
                if(err.code === 30008) return message.channel.send('❌ Vous avez atteint la limite d\'emojis sur votre serveur !');
                if(err.code === 50035) return message.channel.send('❌ Lien invalide.');
                message.channel.send('❌ Une erreur est survenue.');
                console.error(err);
            });
    }
}

module.exports.help = {
    name: "addemoji",
    aliases: ["addemoji", "add-emoji", "emojiadd", "emoji-add"],
    category: 'Moderation',
    description: "Créé un emoji à parti d'un lien ou d'un emoji provenant d'un autre serveur.",
    usage: "[nom] [url | emoji]",
    cooldown: 10,
    memberPerms: ["MANAGE_EMOJIS"],
    botPerms: ["MANAGE_EMOJIS"],
    args: true
}