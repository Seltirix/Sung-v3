const { Role } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    let role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]) || args[0];

    if(role instanceof Role) role = role.id;

    if(!role || !data.plugins.levels.roles_rewards.some(obj => Object.values(obj).includes(role))) return message.channel.send(`⚠️ Impossible de trouver un rôle avec comme ID ${role} dans les rôles récompenses. Merci de fournir une ID uniquement.`);

    data.plugins.levels.roles_rewards = data.plugins.levels.roles_rewards.filter(obj => !Object.values(obj).includes(role));

    data.markModified("plugins.levels.roles_rewards");
    data.save();

    message.channel.send(`✅ Le rôle a bien été retiré de la liste des rôles récompenses.`);
}

module.exports.help = {
    name: "remove-role",
    aliases: ["remove-role", "removerole"],
    category: 'Levels',
    description: "Retirer un rôle des récompenses de rôles.",
    usage: "<role>",
    cooldown: 5,
    memberPerms: ["MANAGE_ROLES"],
    botPerms: [],
    args: false
}