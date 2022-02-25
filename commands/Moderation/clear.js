const { MessageEmbed } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    const toDelete = args[0];
    if(!toDelete || isNaN(toDelete) || parseInt(toDelete) < 1 || parseInt(toDelete) > 100) return message.channel.send(`⚠️ Veuillez indiquer un nombre entre 1 et 100.`);

    const messages = await message.channel.messages.fetch({
        limit: parseInt(Math.min(toDelete, 100)),
        before: message.id
    });

    await message.delete().catch(() => {});

    await message.channel.bulkDelete(messages).then(deletedMessages => {
        let deleted = deletedMessages.size;
        if(deleted == 0) deleted = 1;

        message.channel.send(`✅ ${parseInt(deleted)} message(s) supprimé(s).`);

        if(data.plugins.logs.enabled) {
            if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
                const embed = new MessageEmbed()
                    .setColor(client.config.embed.color)
                    .setDescription(`${message.author} a supprimé ${deleted} message(s) dans ${message.channel}`)
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
    name: "clear",
    aliases: ["clear", "purge"],
    category: "Moderation",
    description: "Supprimer une certaine quantité de messages entre 1 et 100",
    usage: "<nombre de messages>",
    cooldown: 10,
    memberPerms: ["MANAGE_MESSAGES"],
    botPerms: ["MANAGE_MESSAGES"],
    args: true
}
