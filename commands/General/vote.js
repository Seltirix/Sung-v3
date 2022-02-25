const { MessageEmbed } = require("discord.js");

module.exports.run = (client, message) => {
    const embed = new MessageEmbed()
        .setColor('#2F3136')
        .setDescription(`Clique [ici](https://top.gg/bot/781911855299035217) pour voter pour le bot !`)
    message.channel.send(embed);
}

module.exports.help = {
    name: "vote",
    aliases: ["vote"],
    category: "General",
    description: "Envoie un lien pour voter pour le bot !",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
