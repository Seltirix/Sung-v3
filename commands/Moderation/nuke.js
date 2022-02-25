module.exports.run = (client, message, args) => {
    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);

    if(channel) {
        if(channel.deletable) {
            message.channel.send(`Le salon **${channel.name}** sera nuke dans 5 secondes...`);
            setTimeout(async () => {
                await channel.delete(`Nuke by ${message.author}`).then(async (ch) => {
                    console.log(ch.rawPosition)
                    await message.guild.channels.create(ch.name, {
                        type: ch.type,
                        topic: ch.topic,
                        nsfw: ch.nsfw,
                        parent: ch.parent,
                        permissionOverwrites: ch.permissionOverwrites,
                        position: ch.rawPosition,
                        rateLimitPerUser: ch.rateLimitPerUser
                    }).catch(err => {
                        console.error(err);
                        message.author.send(`Une erreur est survenue lors de la création du salon. Veuillez réessayer.`).catch(() => {});
                    });
                }).catch(err => {
                    if(err.code === 50074) return message.channel.send(`⚠️ Impossible de supprimer un salon requis pour la communauté`);
                    console.error(err);
                    message.channel.send(`Une erreur est survenue : \n\`\`\`js${err}\n\`\`\``);
                });
            }, 5000)
        } else return message.channel.send(`⚠️ Je n'ai pas les permissions de supprimer ce salon.`);
    } else {
        if(message.channel.deletable)  {
            message.channel.send(`Le salon **${message.channel.name}** sera nuke dans 5 secondes...`);

            setTimeout(async () => {
                await message.channel.delete(`Nuke by ${message.author}`).then(async (ch) => {
                    await message.guild.channels.create(ch.name, {
                        type: ch.type,
                        topic: ch.topic,
                        nsfw: ch.nsfw,
                        parent: ch.parent,
                        permissionOverwrites: ch.permissionOverwrites,
                        position: ch.rawPosition,
                        rateLimitPerUser: ch.rateLimitPerUser
                    }).catch(err => {
                        console.error(err);
                        message.author.send(`Une erreur est survenue lors de la création du salon. Veuillez réessayer.`).catch(() => {});
                    });
                }).catch(err => {
                    if(err.code === 50074) return message.channel.send(`⚠️ Impossible de supprimer un salon requis pour la communauté`);
                    console.error(err);
                    message.channel.send(`Une erreur est survenue : \n\`\`\`js${err}\n\`\`\``);
                });
            }, 5000)
        } else return message.channel.send(`⚠️ Je n'ai pas les permissions de supprimer ce salon.`);
    }
}

module.exports.help = {
    name: "nuke",
    aliases: ["nuke"],
    category: 'Moderation',
    description: "Nuke le salon si spécifié, sinon nuke le salon dans lequel vous êtes",
    usage: "[salon]",
    cooldown: 20,
    memberPerms: ["MANAGE_CHANNELS"],
    botPerms: ["MANAGE_CHANNELS"],
    args: false
}