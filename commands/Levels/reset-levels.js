const { MessageCollector } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    const filter = m => m.author.id === message.author.id;
    const collector = new MessageCollector(message.channel, filter, {
        time: 30000,
        max: 1
    });

    const MSG = await message.channel.send("⚠️ Êtes-vous sûr de vouloir remettre à 0 les points d'expérience de tous les membres du serveur ? Cette action est irréversible. \nRépondez par oui pour continuer ou répondez par non pour annuler.");

    collector.on("collect", async msg => {
        if(msg.content.toLowerCase() == "oui") {
            collector.stop(true);
            msg.delete();
            MSG.delete();

            data.members.forEach(member => {
                member.exp = 0;
                member.level = 0;
            });

            data.markModified("members");
            data.save();

            return message.channel.send(`L'xp de tous les membres du serveur ont bien été réinitialisés par ${message.author}`);
        } else {
            collector.stop(true);
            msg.delete();
            MSG.delete();

            message.channel.send("Commande annulée");
        }
    });

    collector.on("end", (_, reason) => {
        if(reason == "time") return message.channel.send('Temps écoulé');
    });
}

module.exports.help = {
    name: "reset-levels",
    aliases: ["reset-levels", "resetlevels"],
    category: 'Levels',
    description: "Remettre à 0 les niveaux de tous les membres du serveur.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: [],
    args: false
}