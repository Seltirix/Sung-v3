module.exports = async (client, message) => {
    if(message.channel.type === 'dm') return;
    if(!message.member) return;

    const data = await client.getGuild(message.guild);

    const reactionRole = await require('../models/RolesReactions').findOne({ guildID: message.guild.id, messageID: message.id });
    if(reactionRole) await reactionRole.delete();
    
    const ticketPanel = data.plugins.tickets?.panels?.find((panel) => panel.panelID === message.id);
    if(ticketPanel) {
        data.plugins.tickets.panels.splice(data.plugins.tickets.panels.findIndex((panel) => panel.panelID === message.id), 1);
        data.markModified('plugins.tickets.panels');

        await data.save();
    }
}