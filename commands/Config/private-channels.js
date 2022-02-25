module.exports.run = async (client, message, args, data) => {
    const channelMsg = await message.channel.send('Quel salon souhaitez-vouez définir comme étant celui de création de salon ? \nEnvoyez `aucun` pour que j\'en créer un!');

    message.channel.awaitMessages((m) => m.author.id === message.author.id, { max: 1, time: 30000 })
        .then(async (collected) => {
            let channel;
            if(collected.first()?.content?.toLowerCase() === 'aucun') {
                channel = null;
            } else {
                channel = collected.first().mentions.channels.first() || message.guild.channels.cache.get(collected.first()?.content);
                if(!channel || !message.guild.channels.resolve(channel)) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.');
                if(channel.type !== 'voice') return message.channel.send('⚠️ Merci de spécifier un salon vocal uniquement.');
            }

            channelMsg.delete().catch(() => {});
            collected.first().delete().catch(() => {});
            
            const parentMsg = await message.channel.send('Dans quel catégorie voulez-vous que les salons personnels soient créés ? \nEnvoyez `aucun` pour les créer dans aucune catégorie.');

            message.channel.awaitMessages((m) => m.author.id === message.author.id, { max: 1, time: 30000 })
                .then(async (collectedp) => {
                    let parent;
                    if(collectedp.first()?.content?.toLowerCase() === 'aucun') {
                        parent = null;
                    } else {
                        parent = collectedp.first().mentions.channels.first() || message.guild.channels.cache.get(collectedp.first()?.content) || message.guild.channels.cache.find(c => c.name.toLowerCase() === collectedp.first()?.content?.toLowerCase());
                        if(!parent) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.')
                        if(parent.type !== 'category') return message.channel.send('⚠️ Merci de donner l\'id ou le nom d\'une catégorie');

                        if(!message.guild.me.permissionsIn(parent).has('MANAGE_CHANNELS')) return message.channel.send('⚠️ Je n\'ai pas les permissions de créer des salons dans cette catégorie!');
                    }

                    parentMsg.delete().catch(() => {});
                    collectedp.first().delete().catch(() => {});

                    if(channel === null) {
                        channel = await message.guild.channels.create('➕ Créer ton salon', {
                            type: 'voice',
                            userLimit: 1,
                            permissionOverwrites: [
                                {
                                    id: message.guild.roles.everyone.id,
                                    deny: ['SPEAK', 'STREAM'],
                                    allow: ['CONNECT']
                                },
                                {
                                    id: message.guild.me.id,
                                    allow: ['MANAGE_CHANNELS', 'MOVE_MEMBERS']
                                }
                            ]
                        }).catch(() => message.channel.send('⚠️ Impossible de créer le salon, vérifiez mes permissions et réessayez.'));
                    }

                    data.plugins.privatechannels = {
                        channelID: channel.id,
                        parentID: parent ? parent.id : null
                    }

                    data.markModified("plugins.privatechannels");
                    data.save();

                    message.channel.send(`✅ Les salons privés ont bien été configurés, pour en créer un, vous devrez vous rendre dans le salon vocal <#${channel.id}>, et les salons seront automatiquement créés dans ${parent ? `la catégorie <#${parent.id}>` : 'aucune catégorie'}.`);
                })
                .catch(() => message.channel.send('Temps écoulé'));
        })
        .catch(() => message.channel.send('Temps écoulé'));
}

module.exports.help = {
    name: "private-channels",
    aliases: ["private-channels", "privatechannels", "pchannels", "p-channels"],
    category: 'Config',
    description: "Configurer les salons privés.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_CHANNELS"],
    botPerms: ["MANAGE_CHANNELS"],
    args: false
}
