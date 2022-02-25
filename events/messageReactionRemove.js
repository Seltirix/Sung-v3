module.exports = async (client, reaction, user) => {
    if(user.bot) return;

    const { message } = reaction;
    if(message.partial) await message.fetch().catch(() => {});
    if(!message) return;

    const data = (await require('../models/RolesReactions').findOne({ messageID: message.id }))?.roles_react.find(({ emoji }) => emoji === reaction.emoji.id || emoji === reaction.emoji.name);
    if(!data) return;

    if(reaction.partial) await reaction.fetch().catch(() => {});
    if(!reaction) return;

    if(reaction.emoji.id === data.emoji || reaction.emoji.name === data.emoji) {
        message.guild.members.fetch(user.id).then(async (member) => {
            setTimeout(async () => await member.roles.remove(data.role).catch(() => {}), 1500);
        });
    }
}
