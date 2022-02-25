module.exports = async (client, channel) => {
    if(channel.type == "dm") return;

    const data = await client.getGuild(channel.guild);
    if(!data) return;

    const ticket = await require('../models/Ticket').findOne({ ticketID: channel.id });
    if(ticket) {
        await ticket.delete();

        const logs = await channel.guild.fetchAuditLogs({
            limit: 1,
            type: 'CHANNEL_DELETE'
        }).catch(() => {});

        const author = (logs.entries.first() ? logs.entries.first().executor : channel.guild.members.cache.get(ticket.userID)) || 'Utilisateur inconnu';
        if(author.bot) return;

        const logsChannel = channel.guild.channels.cache.get(data.plugins.tickets.logs_channel);
        if(logsChannel) {
            logsChannel.send({
                embed: {
                    color: 'RED',
                    author: { name: author.tag || author, icon_url: author.tag ? author.displayAvatarURL({ dynamic: true }) : null },
                    title: 'Ticket supprimé',
                    fields: [
                        { name: 'Ticket créé par', value: `<@${ticket.userID}>` },
                        { name: 'Catégorie', value: ticket.panelName }
                    ],
                    footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
                }
            });
        }
    }

    const pChannel = await require('../models/PrivateChannel').findOne({ channelID: channel.id });
    if(pChannel) {
        await pChannel.delete();
    }

    if(data.plugins.membercount) {
        Object.keys(data.plugins.membercount.channels).forEach(async (type) => {
            const ch = data.plugins.membercount.channels[type];

            if(ch.id !== channel.id) return;
            
            data.plugins.membercount.channels[type] = {
                name: null,
                id: null
            };
            data.markModified("plugins.membercount.channels");

            await data.save();
        });
    }

    if(data.plugins.logs.enabled) {
        if(data.plugins.logs.channel) {
            if(!channel.guild.me.hasPermission("VIEW_AUDIT_LOG")) return;
            let cType = channel.type;
            switch (cType) {
                case "text": cType = "Textuel"; break;
                case "voice": cType = "Vocal"; break;
                case "category": cType = "Catégorie"; break;
                case "news": cType = "Annonce"; break;
                case "store": cType = "Magasin"; break;
            }

            const fetchGuildAuditLogs = await channel.guild.fetchAuditLogs({
                limit: 1,
                type: 'CHANNEL_DELETE'
            })

            const latestChannelDeleted = fetchGuildAuditLogs.entries.first();
            const { executor } = latestChannelDeleted;

            if(channel.guild.channels.cache.get(data.plugins.logs.channel)) {
                channel.guild.channels.cache.get(data.plugins.logs.channel).send({
                    embed: {
                        color: 'RED',
                        author: { name: `${executor.username} a supprimé un salon`, icon_url: executor.displayAvatarURL({ dynamic: true }) },
                        fields: [
                            { name: 'Nom', value: channel.name, inline: true },
                            { name: 'Type', value: cType, inline: true },
                        ],
                        footer: { text: 'ID ' + channel.id },
                        timestamp: new Date()
                    }
                });
            }
        }
    }
}
