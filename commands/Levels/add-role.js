module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    if(!args[1] || isNaN(parseInt(args[1])) || parseInt(args[1]) <= 0 || parseInt(args[1]) > 100) return message.channel.send(`⚠️ Veuillez indiquer un niveau auquel donner ce rôle. Le niveau doit être compris entre 1 et 100. \nExemple: \`${data.prefix}add-role @role 10\``);

    const roles_rewards = data.plugins.levels.roles_rewards;
    const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[0]);

    if(!role) return message.channel.send('⚠️ Ce rôle n\'existe pas.');

    if(role.id === message.guild.roles.everyone.id) return message.channel.send('⚠️ Rôle invalide.');

    if(message.member.roles.highest.position <= role.position) return message.channel.send('⚠️ Vous n\'avez pas la permission de donner ce rôle.');

    if(!role.editable) return message.channel.send('⚠️ Je ne peux pas donner ce rôle, vérifiez que j\'ai les permissions nécessaires et que le rôle est bien placé en dessous de moi !');

    if(roles_rewards.some(obj => Object.values(obj).includes(role.id))) return message.channel.send('⚠️ Ce rôle est déjà utilisé comme récompense.');

    if(roles_rewards.length >= 7) return message.channel.send('⚠️ Vous avez atteint la limite de 7 rôles récompenses sur le serveur.');

    roles_rewards.push({ [`l${parseInt(args[1])}`]: role.id });

    data.markModified("plugins.levels.roles_rewards");
    data.save();

    message.channel.send(`✅ Le rôle @\u200b${role.name} sera donné aux membres ayant atteint le niveau ${parseInt(args[1])}.`);
}

module.exports.help = {
    name: "add-role",
    aliases: ["add-role", "addrole"],
    category: 'Levels',
    description: "Ajouter un rôle aux récompenses de rôles.",
    usage: "<role> <niveau>",
    cooldown: 5,
    memberPerms: ["MANAGE_ROLES"],
    botPerms: [],
    args: true
}