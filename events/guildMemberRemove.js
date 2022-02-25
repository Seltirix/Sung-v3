module.exports = async (client, member) => {
    const data = await client.getGuild(member.guild);
    if(!data) return;

    if(!data.plugins.goodbye.enabled) return;

    let goodbyeMsg = data.plugins.goodbye.message
        .replace('{user}', member)
        .replace('{guildName}', member.guild.name)
        .replace('{memberCount}', member.guild.memberCount)
        .replace('{username}', member.user.username)
        .replace('{usertag}', member.user.tag);

    if(!data.plugins.goodbye.channel) {
        await member.send(goodbyeMsg).catch(() => {});
    } else {
        member.guild.channels.cache.get(data.plugins.goodbye.channel).send(goodbyeMsg);
    }
}
