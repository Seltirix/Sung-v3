module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    const member = message.mentions.members.first() || message.guild.members.cache.get(args[0]) || message.guild.members.cache.find(u => u.user.username.toLowerCase().includes(args[0]?.toLowerCase())) || message.guild.member(message.author);

    const p = data.members.map(m => m.id).indexOf(member.id);
    const userData = data.members[p];
    const dbUser = await client.findOrCreateUser(member.user);
    
    if(p == -1 || !userData) return message.channel.send('⚠️ Cet utilisateur n\'est pas classé.');
    if(!dbUser) return message.channel.send('❌ Oops ! Une erreur est survenue, veuillez réessayer.');

    message.channel.send({ files: [{ attachment: await client.generateRankcard(member, userData, dbUser.rankcard), name: "rank.png" }] }).catch(err => {
        message.channel.send(`Une erreur est survenue, veuillez réessayer. \n\`\`\`js\n${err}\n\`\`\``);
        console.error(err);
    });
}

module.exports.help = {
    name: "rank",
    aliases: ["rank", "level"],
    category: 'Levels',
    description: "Voir son niveau actuel.",
    usage: "[membre]",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["ATTACH_FILES"],
    args: false
}
