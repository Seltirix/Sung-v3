const fetch = require('node-fetch');
const emojis = require('../../emojis');

module.exports.run = async (client, message) => {
    let msg = await message.channel.send(`Chargement de l'image... ${emojis.chargement}`);

    const dog = await fetch("https://dog.ceo/api/breeds/image/random")
        .then(res => res.json());

    if(dog.status != "success") {
        msg.delete();
        return message.channel.send("Une erreur est survenue, veuillez réessayez.");
    }

    message.channel.send({
        embed: {
            color: client.config.embed.color,
            description: `[\`[Lien vers l'image]\`](${dog.message})`,
            image: {
                url: dog.message
            },
            footer: {
                text: client.config.embed.footer,
                icon_url: client.user.displayAvatarURL()
            }
        }
    });
    await msg.delete().catch(() => {});
}

module.exports.help = {
    name: "dog",
    aliases: ["dog", "dogs"],
    category: "Fun",
    description: "Envoie une image de chien aléatoire !",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}