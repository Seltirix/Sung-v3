const { MessageEmbed, MessageAttachment } = require("discord.js");
const img = new MessageAttachment('./assets/8-Ball_Pool.svg.png');

module.exports.run = (client, message, args) => {
    const asked = args.join(" ");
    if(!asked) return message.channel.send('⚠️ Veuillez poser une question.');

    if(asked.length < 3 || asked.length > 500) return message.channel.send('⚠️ Votre question doit faire entre 3 et 500 caractères !');

    const answers = ["Oui.", "Non.", "Probablement.", "C'est fort probable.", "C'est certain.", "Je ne saurai répondre à cette question.", "D'après l'agence internationale des volets électriques, non.", "Ca à l'air d'être le cas.", "🤔", "Keske", "Regarde derrière toi.", "Hmm", "Je dirai que non, mais d'après moi oui, mais étant donné que non, alors oui."];
    const answer = Math.floor(Math.random() * answers.length);

    const embed = new MessageEmbed()
        .setColor(client.config.embed.color)
        .setAuthor(`Question de ${message.author.username}`, message.author.displayAvatarURL({ dynamic: true }))
        .attachFiles(img)
        .setThumbnail("attachment://8-Ball_Pool.svg.png")
        .addField("Question:", asked)
        .addField("Réponse:", answers[answer])
        .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
    message.channel.send(embed);
}

module.exports.help = {
    name: "8ball",
    aliases: ["8ball"],
    category: "Fun",
    description: "Répond à votre question de façon totalement aléatoire!",
    usage: "<question>",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: true  
}