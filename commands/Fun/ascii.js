/**
 * Script repris de https://github.com/Androz2091/AtlantaBot/blob/master/commands/Fun/ascii.js
 */

const figlet = require('figlet');
const util = require('util');
const figletAsync = util.promisify(figlet);

module.exports.run = async (client, message, args) => {
    const text = args.join(" ");
    if(!text) return message.channel.send("⚠️ Veuillez spécifier du texte!");

    if(text.length <= 1 || text.length > 15) return message.channel.send('⚠️ Votre texte doit faire entre 1 et 15 caractères.');

    const result = await figletAsync(text);
    if(!result) return message.channel.send('⚠️ Texte invalide.');

    message.channel.send({
        embed: {
            color: client.config.embed.color,
            author: {
                name: message.author.username,
                icon_url: message.author.displayAvatarURL({ dynamic: true })
            },
            description: `\`\`\`${result}\`\`\``,
            footer: {
                text: client.config.embed.footer,
                icon_url: client.user.displayAvatarURL()
            }
        }
    })
}

module.exports.help = {
    name: "ascii",
    aliases: ["ascii", "asciiart", "ascii-art"],
    category: "Fun",
    description: "Transforme votre texte en ascii art !",
    usage: "<texte>",
    cooldown: 5,
    memberPerms: [],
    botPerms: [],
    args: true
}