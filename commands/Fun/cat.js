const cats = require('../../assets/cats.json');

module.exports.run = async (client, message) => {
    const cat = cats[Math.floor(Math.random() * cats.length)];
    if(!cat) return message.channel.send('⚠️ Une erreur est survenue, veuillez réessayer.');

    message.channel.send({
        embed: {
            color: client.config.embed.color,
            description: `[\`[Lien vers l'image]\`](${cat})`,
            image: {
                url: cat
            },
            footer: {
                text: client.config.embed.footer,
                icon_url: client.user.displayAvatarURL()
            }
        }
    });
}

module.exports.help = {
    name: "cat",
    aliases: ["cat", "cats"],
    category: "Fun",
    description: "Envoie une image de chat aléatoire !",
    usage: "",
    cooldown: 2,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
