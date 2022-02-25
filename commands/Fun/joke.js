const { MessageEmbed } = require('discord.js');
const fetch = require('node-fetch');

module.exports.run = async (client, message) => {
    if(!message.channel.nsfw) return message.channel.send("⚠️ Cette commande peut être exécutée uniquement dans un salon NSFW.");

    await fetch('https://www.blagues-api.fr/api/random', {
        headers: {
            'Authorization': `Bearer ${process.env.BLAGUEAPITOKEN}`
        }
    })
    .then(res => res.json())
    .then(data => {
        const { joke, answer } = data;

        const embed = new MessageEmbed()
            .setColor(client.config.embed.color)
            .setAuthor(message.author.username, message.author.displayAvatarURL({ dynamic: true }))
            .setDescription("**" + joke + "**" + "\n Réponse: ||" + answer + "||")
            .setTimestamp();
        message.channel.send(embed);
    });
}

module.exports.help = {
    name: "joke",
    aliases: ["joke", "blague"],
    category: "Fun",
    description: "Raconte une blague !",
    usage: "",
    cooldown: 3,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
