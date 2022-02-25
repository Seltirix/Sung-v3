const { MessageCollector } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.logs.enabled) return message.channel.send(`⚠️ Le plugin de logs n'est pas activé. Faites \`${data.prefix}enable logs\` pour l'activer!`);

    if(args.length) {
        const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[0]);
        if(!channel || !message.guild.channels.resolve(channel)) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.');
        if(channel.type != "text") return message.channel.send('⚠️ Merci de donner un salon textuel. Je ne peux envoyer les messages de logs que dans un salon textuel (exclu salon d\'annonce)');
        if(!message.guild.me.permissionsIn(channel).has('SEND_MESSAGES') || !message.guild.me.permissionsIn(channel).has('EMBED_LINKS')) return message.channel.send('⚠️ Je n\'ai pas les permissions de parler dans ce salon, mettez moi les permissions Envoyer des messages et Intégrer des liens dans le salon.');

        message.delete().catch(() => {});

        data.plugins.logs = {
            enabled: true,
            channel: channel.id
        }

        data.markModified("plugins.logs");
        data.save();

        return message.channel.send('✅ Salon de logs configuré. Les logs s\'enverront désormais dans <#' + channel.id + '>. \nFaites `' + data.prefix + 'config` pour voir la configuration actuelle du bot sur le serveur!');
    } else {
        const filter = m => m.author.id === message.author.id;
        let MSG = await message.channel.send('Dans quel salon souhaitez-vous définir comme salon de logs ?');

        const c = new MessageCollector(message.channel, filter, {
            time: 60000,
            max: 5,
        });

        c.on("collect", async msg1 => {
            const channel = msg1.mentions.channels.first() || msg1.guild.channels.cache.get(msg1.content);
            if(!channel) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.');

            if(channel.type != "text") return message.channel.send('⚠️ Merci de donner un salon textuel. Je ne peux envoyer les messages de logs que dans un salon textuel (exclu salon d\'annonce)');

            if(!message.guild.me.permissionsIn(channel).has('SEND_MESSAGES') || !message.guild.me.permissionsIn(channel).has('EMBED_LINKS')) return message.channel.send('⚠️ Je n\'ai pas les permissions de parler dans ce salon, mettez moi les permissions Envoyer des messages et Intégrer des liens dans le salon.');

            c.stop(true);

            MSG.delete().catch(() => {});
            msg1.delete().catch(() => {});

            data.plugins.logs = {
                enabled: true,
                channel: channel.id
            }

            data.markModified("plugins.logs");
            data.save();

            message.channel.send('✅ Salon de logs configuré. Les logs s\'enverront désormais dans <#' + channel.id + '>. \nFaites `' + data.prefix + 'config` pour voir la configuration actuelle du bot sur le serveur!');
        });

        c.on("end", (collected, reason) => {
            if(collected.size >= 5) return message.channel.send('⚠️ Vous avez dépassés les 5 essais. Veuillez refaire la commande et réessayez');
            if(reason === "time") return message.channel.send('Temps écoulé')
        });
    }
}

module.exports.help = {
    name: "logschannel",
    aliases: ["logschannel", "logs-channel", "logchannel", "log-channel"],
    category: 'Config',
    description: "Modifier le salon de logs",
    usage: "<salon>",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: [],
    args: false
}
