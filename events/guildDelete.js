const { MessageEmbed } = require("discord.js");

module.exports = async (client, guild) => {
    const newGuildEmbed = new MessageEmbed()
        .setColor('RED')
        .setAuthor(guild.name, guild.iconURL({ dynamic: true }))
        .setDescription(`J'ai quitté le serveur ${guild.name} :/ Je suis maintenant dans **` + client.guilds.cache.size + `** serveurs.`)
        .setFooter(client.config.embed.footer, client.user.displayAvatarURL())
    client.channels.cache.get(client.config.support.logs).send(newGuildEmbed);
}
