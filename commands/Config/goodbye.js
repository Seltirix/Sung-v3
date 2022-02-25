const { MessageCollector } = require('discord.js');

module.exports.run = async (client, message, args, data) => {
    if(!data.plugins.goodbye.enabled) return message.channel.send(`⚠️ Le plugin d'aurevoir n'est pas activé. Faites \`${data.prefix}enable goodbye\` pour l'activer!`);

    if(args[0] === "channel") {
        const ch = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
        if(args[1] && ch) {
            if(!message.guild.channels.resolve(ch)) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.');
            if(ch.type != "text") return message.channel.send('⚠️ Merci de donner un salon de type textuel. Les salons d\'annonces ne sont pas acceptés.');
            if(ch.id == data.plugins.goodbye.channel) return message.channel.send('⚠️ Ce salon est déjà défini comme salon d\'aurevoir!');
            if(!message.guild.me.permissionsIn(ch).has('SEND_MESSAGES')) return message.channel.send('⚠️ Je n\'ai pas les permissions de parler dans ce salon, mettez moi la permission Envoyer des messages dans le salon.');

            data.plugins.goodbye = {
                enabled: true,
                message: data.plugins.goodbye.message,
                channel: ch.id
            }

            data.markModified("plugins.goodbye");
            data.save();

            return message.channel.send('✅ Salon d\'aurevoir modifié.');
        } else {
            const filter = m => m.author.id === message.author.id;

            const MSG = await message.channel.send('Quel salon souhaitez-vous définir comme salon d\'aurevoir ? Envoyez \'MP\' pour les envoyer en Messages Privés.');

            const c = new MessageCollector(message.channel, filter, {
                time: 60000,
                max: 3,
            })

            c.on("collect", async msg => {
                if(msg.content?.toLowerCase() === 'mp') {
                    data.plugins.goodbye.channel = null;
                    data.markModified('plugins.goodbye.channel');

                    await data.save();

                    c.stop();

                    return message.channel.send('✅ Les messages d\'aurevoir s\'enverront désormais en MP.');
                }

                const channel = msg.mentions.channels.first() || msg.guild.channels.cache.get(msg.content);
                if(!channel) return message.channel.send('⚠️ Ce salon n\'existe pas, vérifiez que j\'ai accès au salon.');
                if(channel.type != "text") return message.channel.send('⚠️ Merci de donner un salon de type textuel. Les salons d\'annonces ne sont pas acceptés.');
                if(channel.id == data.plugins.goodbye.channel) return message.channel.send('⚠️ Ce salon est déjà défini comme salon d\'aurevoir!');
                if(!message.guild.me.permissionsIn(channel).has('SEND_MESSAGES')) return message.channel.send('⚠️ Je n\'ai pas les permissions de parler dans ce salon, mettez moi la permission Envoyer des messages dans le salon.');

                c.stop(true);

                MSG.delete().catch(() => {});
                msg.delete().catch(() => {});

                data.plugins.goodbye = {
                    enabled: true,
                    message: data.plugins.goodbye.message,
                    channel: channel.id
                }

                data.markModified("plugins.goodbye");
                data.save();

                message.channel.send('✅ Salon d\'aurevoir modifié. Les messages d\'aurevoir s\'enverront désormais dans <#' + channel.id + '>. \nFaites `' + data.prefix + 'config` pour voir la configuration actuelle du bot sur le serveur!');
            });

            c.on("end", (_, reason) => {
                if(reason === 'limit') return message.channel.send('Vous avez fait trop d\'essais! Refaite la commande puis réessayez.');
                if(reason === "time") return message.channel.send('Temps écoulé');
            });
        }
    } else if(args[0] === "message") {
        if(args[1]) {
            const newMessage = args.slice(1).join(" ");
            if(newMessage.length < 5) return message.channel.send('⚠️ Le message d\'aurevoir doit faire plus de 5 caractères !');

            if(newMessage === data.plugins.goodbye.message) return message.channel.send('⚠️ Ce message est le même que celui actuellement défini 🤔');

            data.plugins.goodbye = {
                enabled: true,
                message: newMessage,
                channel: data.plugins.goodbye.channel
            }

            data.markModified("plugins.goodbye");
            data.save();

            return message.channel.send('✅ Message d\'aurevoir modifié. \nFaites `' + data.prefix + 'config` pour voir la configuration actuelle du bot sur le serveur!');
        } else {
            const filter = m => m.author.id === message.author.id;
        
            let MSG = await message.channel.send('Quel message souhaitez-vous définir comme message d\'aurevoir ?');

            const c1 = new MessageCollector(message.channel, filter, {
                time: 60000,
                max: 3,
            })

            c1.on("collect", async msg1 => {
                const newMessage = msg1.content;

                if(newMessage.length < 5) return message.channel.send('⚠️ Le message d\'aurevoir doit faire plus de 5 caractères !');

                if(newMessage === data.plugins.goodbye.message) return message.channel.send('⚠️ Ce message est le même que celui actuellement défini 🤔');

                c1.stop(true);

                MSG.delete().catch(() => {});
                msg1.delete().catch(() => {});

                data.plugins.goodbye = {
                    enabled: true,
                    message: newMessage,
                    channel: data.plugins.goodbye.channel
                }

                data.markModified("plugins.goodbye");
                data.save();

                message.channel.send('✅ Message d\'aurevoir modifié. \nFaites `' + data.prefix + 'config` pour voir la configuration actuelle du bot sur le serveur!');
            });

            c1.on("end", (_, reason) => {
                if(reason === 'limit') return message.channel.send('Vous avez fait trop d\'essais! Refaite la commande puis réessayez.');
                if(reason === "time") return message.channel.send('Temps écoulé');
            });
        }
    } else if(args[0] == "test") {
        if(!data.plugins.goodbye.channel) return message.channel.send('⚠️ Aucun salon d\'aurevoir n\'est défini. Faites `' + data.prefix + 'goodbye channel` pour le configurer!');

        let goodbyeMsg = data.plugins.goodbye.message;
        goodbyeMsg.replace('{user}', message.author)
            .replace('{guildName}', message.guild.name)
            .replace('{memberCount}', message.guild.memberCount)
            .replace('{username}', message.author.username)
            .replace('{usertag}', message.author.tag);

        message.guild.channels.cache.get(data.plugins.goodbye.channel).send(goodbyeMsg);

        return message.channel.send('✅ Test effectué, allez voir ca dans <#' + data.plugins.goodbye.channel + '> !');
    } else {
        message.channel.send(`⚠️ Vous n'utilisez pas la commande correctement.\nFaites \`${data.prefix}goodbye <channel | message | test>\``);
    }
}

module.exports.help = {
    name: "goodbye",
    aliases: ["goodbye"],
    category: 'Config',
    description: "Modifier le message ou le salon d'aurevoir",
    usage: "<message | channel | test>",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: ["EMBED_LINKS"],
    args: false
}
