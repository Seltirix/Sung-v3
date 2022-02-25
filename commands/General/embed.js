module.exports.run = async (client, message) => {
    client.askEmbed(message, {
        footer: {
            text: message.author.tag,
            icon_url: message.author.displayAvatarURL({ dynamic: true })
        },
        timestamp: new Date()
    }).then((embed) => {
        message.channel.send({ embed }).catch((err) => {
            message.channel.send(`Une erreur est surevenue lors de l'envoi de l'embed: \n\`\`\`${err}\`\`\``);
        });
    });
}

module.exports.help = {
    name: "embed",
    aliases: ["embed", "customembed", "custom-embed"],
    category: "General",
    description: "Créer un embed custom",
    usage: "",
    cooldown: 5,
    memberPerms: ["EMBED_LINKS"],
    botPerms: ["EMBED_LINKS"],
    args: false
}
