const { MessageCollector } = require("discord.js");

module.exports.run = (client, message, args, data) => {
    if(!data.plugins.suggestion.enabled) {
        let desc = "⚠️ Les suggestions ne sont pas activées sur le serveur!";
        if(message.member.permissions.has("MANAGE_GUILD")) desc += "\nActivez les grâce à la commande `" + data.prefix + "enable suggestion`.";
        return message.channel.send(desc);
    }

    if(!message.guild.channels.cache.get(data.plugins.suggestion.channel)) {
        let desc = "⚠️ Le salon de suggestion n'est pas défini";
        if(message.member.permissions.has("MANAGE_GUILD")) desc += "\nConfigurez le avec la commande `" + data.prefix + "suggestion-channel`.";
        return message.channel.send(desc);
    }

    const embed = {
        color: client.config.embed.color,
        author: { name: `Suggestion de ${message.author.tag}`, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
        footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
    };

    if(!args.length) {
        message.channel.send('Quelle suggestion souhaitez-vous soumettre au serveur ?');

        const c = new MessageCollector(message.channel, (m) => m.author.id === message.author.id, {
            time: 60000,
            max: 1
        });

        c.on("collect", async msg => {
            if(msg.content.toLowerCase() === "annuler") {
                c.stop(true);
                return message.channel.send('Commande annulée');
            } else {
                if(msg.content.length < 5) return message.channel.send('Veuillez faire une suggestion plus longue que ça!');
                if(msg.content.length > 1000) return message.channel.send('Votre suggestion est trop longue :/');

                embed.description = msg.content;
                message.guild.channels.cache.get(data.plugins.suggestion.channel).send({ embed }).then(async m => {
                    await m.react("✅");
                    await m.react("❌");
                });

                msg.delete().catch(() => {});

                message.channel.send(`Votre suggestion a bien été envoyé dans <#${data.plugins.suggestion.channel}> !`);
            }
        });

        c.on("end", (_, reason) => {
            if(reason == "time") return message.channel.send('Temps écoulé');
        });
    } else {
        const suggestion = args.slice(0).join(' ');

        if(!suggestion) return message.channel.send('Veuillez spécifiez une suggestion!');
        if(suggestion.length < 5) return message.channel.send('Veuillez faire une suggestion plus longue que ça!');
        if(suggestion.length > 1000) return message.channel.send('Votre suggestion est trop longue :/');

        embed.description = suggestion;
        message.guild.channels.cache.get(data.plugins.suggestion.channel).send({ embed }).then(async m => {
            await m.react("✅");
            await m.react("❌");
        });

        message.delete().catch(() => {});
        message.channel.send(`Votre suggestion a bien été envoyé dans <#${data.plugins.suggestion.channel}> !`);
    }
}

module.exports.help = {
    name: "suggestion",
    aliases: ["suggestion", "suggestions", "suggest"],
    category: 'General',
    description: "Soumettre une suggestion au serveur.",
    usage: "<suggestion>",
    cooldown: 5,
    memberPerms: [],
    botPerms: ["EMBED_LINKS"],
    args: false
}
