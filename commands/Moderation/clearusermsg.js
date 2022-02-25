const { MessageEmbed } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    let user = message.mentions.users.first() || client.users.cache.get(args[0]) || client.users.cache.find(u => u.username.toLowerCase().includes(args[0].toLowerCase()));

    if(!user) return message.channel.send("⚠️ Veuillez mentionner un utilisateur à qui supprimer des messages.");

    let toDelete = args[1];
    if(!toDelete || isNaN(toDelete) || parseInt(toDelete) < 1 || parseInt(toDelete) > 100) return message.channel.send(`⚠️ Veuillez indiquer un nombre entre 1 et 100.`);

    let messages = (await message.channel.messages.fetch({
        limit: 100,
        before: message.id
    })).filter(a => a.author.id === user.id).array();

    messages.length = Math.min(parseInt(toDelete), messages.length);

    if(messages.length === 0) return message.channel.send(`⚠️ Il n'y a aucun message de cet utilisateur a supprimer.`);

    await message.delete().catch(() => {});

    await message.channel.bulkDelete(messages).then(deletedMessage => {
        let deleted = deletedMessage.size;
        if(deleted === 0) deleted = 1;

        message.channel.send(`✅ ${deleted} messages supprimés de ${user}.`);
        
        if(data.plugins.logs.enabled) {
            if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
                const embed = new MessageEmbed()
                    .setColor(client.config.embed.color)
                    .setDescription(`${message.author} a supprimé ${deleted} messages de l'utilisateur **${user.username}**.`)
                    .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
                message.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
            }
        }
    }).catch(err => {
        if(err.code == "50034") return message.channel.send(`⚠️ Impossible de supprimer des messages vieux de plus de 2 semaines.`);
        else {
            if(err.code != "10008");
            console.log(err);
            return message.channel.send(`⚠️ Une erreur est survenue, veuillez réessayer. \n\`\`\`js\n${err}\n\`\`\``);
        }
    });
}

module.exports.help = {
    name: "clearusermsg",
    aliases: ["clearusermsg", "prune", "purgeusermsg"],
    category: "Moderation",
    description: "Supprimer une certaine quantité de messages d'un utilisateur entre 1 et 100",
    usage: "<membre> <nombre de messages>",
    cooldown: 10,
    memberPerms: ["MANAGE_MESSAGES"],
    botPerms: ["MANAGE_MESSAGES"],
    args: true
}
