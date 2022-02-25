module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    if(args[0] == "remove") {
        data.plugins.levels.level_up_channel = null;

        data.markModified("plugins.levels.level_up_channel");
        data.save();

        return message.channel.send('✅ Le salon de montées en niveau a bien été retiré.');
    }

    const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
    if(!channel) return message.channel.send("⚠️ Merci de spéficier un salon.");

    if(channel.type != "text") return message.channel.send('⚠️ Merci de donner un salon de type textuel.');

    if(!message.guild.me.permissionsIn(channel).has('SEND_MESSAGES') || !message.guild.me.permissionsIn(channel).has('EMBED_LINKS')) return message.channel.send('⚠️ Je n\'ai pas les permissions de parler dans ce salon, mettez moi les permissions Envoyer des messages et Intégrer des liens dans le salon.');

    if(channel.id === data.plugins.levels.level_up_channel) return message.channel.send('⚠️ Ce salon est le même que celui actuellement défini.');

    data.plugins.levels.level_up_channel = channel.id;

    data.markModified("plugins.levels.level_up_channel");
    data.save();

    message.channel.send(`✅ Le salon de montées en niveau a bien été défini sur le salon <#${channel.id}>`);
}

module.exports.help = {
    name: "set-level-channel",
    aliases: ["set-level-channel", "setlevelchannel", "slc"],
    category: 'Levels',
    description: "Définir le salon de messages de montées en niveau.",
    usage: "<channel | remove>",
    cooldown: 5,
    memberPerms: ["MANAGE_CHANNELS"],
    botPerms: [],
    args: true
}