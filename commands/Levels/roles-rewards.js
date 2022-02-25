module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    if(data.plugins.levels.roles_rewards.length < 1) return message.channel.send(`⚠️ Aucun rôle récompense à afficher. Ajoutez-en avec la commande \`${data.prefix}add-role <role> <niveau>\``);

    data.plugins.levels.roles_rewards = data.plugins.levels.roles_rewards.sort((a, b) => Object.keys(a).join().replace(/l/g, '') - Object.keys(b).join().replace(/l/g, ''));

    const allRoles = data.plugins.levels.roles_rewards.map(obj => `**${Object.keys(obj).join().replace(/l/g, 'Niveau ')}** : ${message.guild.roles.cache.get(Object.values(obj)[0]) ? message.guild.roles.cache.get(Object.values(obj)[0]) : `Role supprimé (ID: ${Object.values(obj)[0]})`}`).join('\n');

    message.channel.send({
        embed: {
            color: client.config.embed.color,
            title: 'Liste des récompenses de rôles sur le serveur',
            author: {
                icon_url: message.author.displayAvatarURL({ dynamic: true }),
                name: message.author.tag
            },
            description: allRoles,
            footer: {
                icon_url: client.user.displayAvatarURL(),
                text: client.config.embed.footer
            }
        }
    });
}

module.exports.help = {
    name: "roles-rewards",
    aliases: ["roles-rewards", "rolesrewards", "rolerewards", "role-rewards"],
    category: 'Levels',
    description: "Voir tous les rôles récompenses du serveur.",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
