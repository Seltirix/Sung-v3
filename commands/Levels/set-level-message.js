module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.levels.enabled) return message.channel.send(`⚠️ Le système de niveau n'est pas activé sur le serveur. Activez-le avec la commande \`${data.prefix}enable levels\``);

    const newMessage = args.join(' ');
    if(!newMessage) return message.channel.send('⚠️ Merci de spécifier un message.');

    if(newMessage === data.plugins.levels.level_up_message) return message.channel.send('⚠️ Ce salon est le même que celui actuellement défini.');

    data.plugins.levels.level_up_message = newMessage;

    data.markModified("plugins.levels.level_up_message");
    data.save();

    message.channel.send(`✅ Le message de montées en niveau a bien été modifié.`);
}

module.exports.help = {
    name: "set-level-message",
    aliases: ["set-level-message", "setlevelmessage", "slm"],
    category: 'Levels',
    description: "Définir le message de montées en niveau.",
    usage: "<message>",
    cooldown: 5,
    memberPerms: ["MANAGE_CHANNELS"],
    botPerms: [],
    args: true
}