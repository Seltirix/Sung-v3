module.exports.run = async (client, message, args, data) => {
    if(args[0]) {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.guild.channels.cache.find((c) => c.name.toLowerCase().includes(args[0]));
        const overwrites = channel.permissionOverwrites.array().map(({ id, type, deny, allow }) => {
            return { id, type, deny: deny.bitfield, allow: allow.bitfield };
        });

        if(!message.guild.channels.cache.get(channel?.id)) return message.channel.send('⚠️ Salon introuvable, réessayez en le mentionnant, donnant son id ou son nom.');
        if(!message.guild.me.permissionsIn(channel).has(['VIEW_CHANNEL', 'MANAGE_CHANNELS'])) return messsage.channel.send('⚠️ Je n\'ai pas les permissions nécessaires pour modifier ce salon !');
        if(data.locked_channels?.find((ch) => ch.id === channel.id)) return message.channel.send(`⚠️ Ce salon est déjà fermé, réouvrez-le avec la commande \`${data.prefix}unlock\``);

        channel.overwritePermissions([
            {
                id: message.guild.roles.everyone.id,
                deny: channel.type === 'voice' ? ['CONNECT', 'SPEAK'] : ['SEND_MESSAGES', 'ADD_REACTIONS']
            },
            {
                id: message.author.id,
                allow: channel.type === 'voice' ? ['CONNECT', 'SPEAK', 'MANAGE_CHANNELS'] : ['SEND_MESSAGES', 'ADD_REACTIONS', 'MANAGE_CHANNELS']
            },
            {
                id: client.user.id,
                allow: channel.type === 'voice' ? ['CONNECT', 'SPEAK', 'MANAGE_CHANNELS'] : channel.type === 'category' ? ['CONNECT', 'SPEAK', 'SEND_MESSAGES', 'ADD_REACTIONS', 'MANAGE_CHANNELS'] : ['SEND_MESSAGES', 'ADD_REACTIONS', 'MANAGE_CHANNELS']
            }
        ]).then(async (chan) => {
            if(chan.type === 'category') {
                for (const catChannel of message.guild.channels.cache.filter((c) => c.parentID === chan.id).array()) {
                    const oldPermissions = catChannel.permissionOverwrites.array().map(({ id, type, deny, allow }) => {
                        return { id, type, deny: deny.bitfield, allow: allow.bitfield };
                    });

                    await catChannel.lockPermissions().catch(() => {});

                    data.locked_channels
                        ? data.locked_channels.push({ id: catChannel.id, overwrites: oldPermissions })
                        : data.locked_channels = [{ id: catChannel.id, overwrites: oldPermissions }];

                    data.markModified('locked_channels');
                }
            }

            data.locked_channels
                ? data.locked_channels.push({ id: channel.id, overwrites })
                : data.locked_channels = [{ id: channel.id, overwrites }];

            data.markModified('locked_channels');
            await data.save();

            message.channel.send(`✅ **Le salon ${channel} a bien été fermé${channel.type === 'category' ? ' et les salons de la catégorie aussi' : ''}.**`);
        }).catch(() => {
            message.channel.send('❌ Une erreur est survenue, assurez-vous que j\'ai accès au salon et que je possède les permissions nécessaires pour le modifier.');
        });
    } else {
        const overwrites = message.channel.permissionOverwrites.array().map(({ id, type, deny, allow }) => {
            return { id, type, deny: deny.bitfield, allow: allow.bitfield };
        });

        if(!message.guild.me.permissionsIn(message.channel).has(['VIEW_CHANNEL', 'MANAGE_CHANNELS'])) return message.channel.send('⚠️ Je n\'ai pas les permissions nécessaires pour modifier ce salon !');
        if(data.locked_channels?.find((ch) => ch.id === message.channel.id)) return message.channel.send(`⚠️ Ce salon est déjà fermé, réouvrez-le avec la commande \`${data.prefix}unlock\`.`);

        await message.channel.overwritePermissions([
            {
                id: message.guild.roles.everyone.id,
                deny: ['SEND_MESSAGES', 'ADD_REACTIONS']
            },
            {
                id: message.author.id,
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'MANAGE_CHANNELS']
            },
            {
                id: client.user.id,
                allow: ['SEND_MESSAGES', 'ADD_REACTIONS', 'MANAGE_CHANNELS']
            }
        ]).then((channel) => {
            data.locked_channels
                ? data.locked_channels.push({ id: channel.id, overwrites })
                : data.locked_channels = [{ id: channel.id, overwrites }];

            data.markModified('locked_channels');
            data.save().then(() => {
                message.channel.send(`✅ **Le salon ${message.channel} a bien été fermé.**`);
            });
        }).catch(() => {
            message.channel.send('❌ Une erreur est survenue, assurez-vous que je possède les permissions nécessaires pour le modifier.');
        });
    }
}

module.exports.help = {
    name: 'lock',
    aliases: ['lock'],
    category: 'Moderation',
    description: 'Fermer un salon aux membres du serveur pour qu\'ils ne puissent plus y parler.\nFermer une catégorie reviendera à fermer tous les salons de la catégorie.',
    usage: '[salon]',
    cooldown: 5,
    memberPerms: ['MANAGE_CHANNELS'],
    botPerms: ['MANAGE_CHANNELS'],
    args: false
}
