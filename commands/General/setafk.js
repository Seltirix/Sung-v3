module.exports.run = async (client, message, args) => {
    const user = await client.findOrCreateUser(message.author);

    const reason = args.join(" ");
    if(!reason) return message.channel.send('⚠️ Merci de spécifier une raison.');
    if(reason.length > 1000) return message.channel.send('⚠️ La raison ne doit pas excéder 1000 caractères.');    

    user.afk = {
        is_afk: true,
        reason: reason
    }

    user.markModified("afk");
    user.save();

    message.channel.send('✅ Vous avez bien été défini comme étant afk. Désormais, si quelqu\'un vous mentionne, il sera directement averti de votre absence. Si vous envoyez un message, vous serez automatiquement défini comme n\'étant plus afk.');
}

module.exports.help = {
    name: "setafk",
    aliases: ["setafk", "set-afk", "afk"],
    category: "General",
    description: "Se définir comme étant afk sur tous les serveurs.",
    usage: "<raison>",
    cooldown: 5,
    memberPerms: [],
    botPerms: [],
    args: true
}