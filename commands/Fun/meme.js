const fetch = require('node-fetch');
const emojis = require('../../emojis');

module.exports.run = async (client, message) => {
    let msg = await message.channel.send(`Chargement de l'image... ${emojis.chargement}`);

    const memes = await fetch("https://www.reddit.com/r/memes/top.json?count=500")
        .then(res => res.json())
        .then(json => json.data.children);

    const meme = memes[Math.floor(Math.random() * memes.length)].data;

    message.channel.send({
        embed: {
            color: client.config.embed.color,
            description: `**${meme.title}** \n[\`[Lien vers l'image]\`](${meme.url})`,
            image: {
                url: meme.url
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
    name: "meme",
    aliases: ["meme", "memes"],
    category: "Fun",
    description: "Envoie un meme aléatoire !",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}