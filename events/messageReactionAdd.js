const Ticket = require('../models/Ticket');

module.exports = async (client, reaction, user) => {
    if(user.bot) return;

    const { message } = reaction;
    if(message.partial) await message.fetch().catch(() => {});
    if(!message) return;
    if(message.channel.type === 'dm') return;

    if(reaction.partial) await reaction.fetch().catch(() => {});
    if(!reaction) return;

    const data = (await require('../models/RolesReactions').findOne({ messageID: message.id }))?.roles_react.find(({ emoji }) => emoji === reaction.emoji.id || emoji === reaction.emoji.name);
    if(data) {
        if(reaction.emoji.id === data.emoji || reaction.emoji.name === data.emoji) {
            message.guild.members.fetch(user.id).then((member) => {
                setTimeout(async () => await member.roles.add(data.role).catch(() => {}), 1500);
            });
        }
    }

    const guildData = await require('../models/Guild').findOne({ id: message.guild.id });
    const ticketsData = guildData?.plugins.tickets;
    const panel = ticketsData?.panels?.find((p) => p.panelID === message.id);

    if(panel) {
        if(reaction.emoji.name === panel.reaction || reaction.emoji.id === panel.reaction) {
            await reaction.users.remove(user);

            const ticket = await Ticket.findOne({ userID: user.id, guildID: message.guild.id })
            if(ticket) return user.send(`⚠️ Vous avez un ticket d'ouvert sur ce serveur (<#${ticket.ticketID}>) !`);

            panel.ticketsCount++;
            const options = {
                topic: `ticket-${client.formatTicketCount(panel.ticketsCount)} | Ticket ouvert par <@${user.id}> (${user.id})`,
                permissionOverwrites: [
                    {
                        id: reaction.message.guild.roles.everyone.id,
                        deny: ['VIEW_CHANNEL']
                    },
                    {
                        id: user.id,
                        allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'ATTACH_FILES']
                    },
                    ...message.guild.members.cache.filter((m) => ['MANAGE_GUILD', 'MANAGE_CHANNELS', 'BAN_MEMBERS'].some((p) => m.permissions.toArray().includes(p))).array().map((member) => {
                        return {
                            id: member.id,
                            allow: ['VIEW_CHANNEL', 'EMBED_LINKS', 'MANAGE_MESSAGES']
                        };
                    })
                ],
                rateLimitPerUser: 2
            };

            const parent = message.guild.channels.cache.get(panel.category);
            if(parent) options.parent = parent.id;

            const channel = await message.guild.channels.create('ticket-' + client.formatTicketCount(panel.ticketsCount), options).catch(() => {});

            channel.send(`Bienvenue dans votre ticket ${user}.`, {
                embed: {
                    color: client.config.embed.color,
                    description: 'Veuillez patienter le temps qu\'un staff ne réponde.',
                    footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
                }
            });

            const logsChannel = message.guild.channels.cache.get(ticketsData.logs_channel);
            if(logsChannel) {
                logsChannel.send({
                    embed: {
                        color: 'GREEN',
                        author: { name: user.tag, icon_url: user.displayAvatarURL({ dynamic: true }) },
                        fields: [
                            { name: 'Ticket créé par', value: user, inline: true },
                            { name: 'Salon', value: `<#${channel.id}>`, inline: true },
                            { name: 'Catégorie', value: panel.panelName, inline: true }
                        ],
                        footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
                    }
                });
            }

            await new Ticket({
                _id: require('mongoose').Types.ObjectId(),
                userID: user.id,
                guildID: message.guild.id,
                ticketID: channel.id,
                panelName: panel.panelName,
                panelID: panel.panelID,
                ticketNumber: panel.ticketsCount
            }).save();

            guildData.markModified('plugins.tickets.panels');

            await guildData.save();
        }
    }
}
