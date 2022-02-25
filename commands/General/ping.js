module.exports.run = async (client, message) => {
    message.channel.send('Pinging...').then(async(msg) => {
        await msg.edit(`Mon ping est de ${Date.now() - msg.createdTimestamp}ms`);
    });
}

module.exports.help = {
    name: "ping",
    aliases: ["ping"],
    category: "General",
    description: "Vérifier la latence du bot",
    usage: "",
    cooldown: 5,
    memberPerms: [],
    botPerms: [],
    args: false
}
