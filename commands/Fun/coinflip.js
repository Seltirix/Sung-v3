const { MessageEmbed, MessageAttachment } = require("discord.js");
const pile = new MessageAttachment('./assets/pile.png');
const face = new MessageAttachment('./assets/face.png');

module.exports.run = (client, message, args) => {
    const pof = ["pile", "face"];
    const random = pof[Math.floor(Math.random() * pof.length)];

    let embed = new MessageEmbed()
        .setColor(client.config.embed.color)
        .setAuthor(message.author.tag, message.author.displayAvatarURL({ dynamic: true }))
        .setDescription(`Le côté **${random}** a été choisi!`)
        .setFooter(client.config.embed.footer, client.user.displayAvatarURL());

    if(random === 'face') {
        embed.attachFiles(face).setThumbnail("attachment://face.png");
    } else if(random === "pile") {
        embed.attachFiles(pile).setThumbnail("attachment://pile.png");
    }

    message.channel.send("Lancement de la pièce...").then(msg => {
        setTimeout(() => {
            msg.delete();
            message.channel.send(embed);
        }, 3000);
    });
}

module.exports.help = {
    name: "coinflip",
    aliases: ["coinflip", "coin-flip","pof", "pileouface", "pile-ou-face"],
    category: "Fun",
    description: "Jouer au pile ou face !",
    usage: "<pile | face>",
    cooldown: 3,
    memberPerms: [],
    botPerms: [],
    args: false
}