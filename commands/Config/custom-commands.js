const Command = require('../../models/Command');
const { enabled, disabled } = require('../../emojis');

module.exports.run = async (client, message, args, data) => {
    const cData = await Command.find({ guildID: message.guild.id });
    if(!cData || cData.length < 1) return message.channel.send('⚠️ Aucune commande personnalisée n\'a été trouvée.');

    let page = 1;

    const embed = {
        color: client.config.embed.color,
        title: `Page ${page}/${cData.length}`,
        author: { name: message.author.tag, icon_url: message.author.displayAvatarURL({ dynamic: true }) },
        thumbnail: { url: message.guild.iconURL({ dynamic: true }) },
        footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
    };
    const firstCmd = cData[0];

    embed.description = `**__Commande ${firstCmd.name}__**:\n\n**Activée**: ${firstCmd.enabled ? enabled : disabled}\n**Affichée dans le help**: ${firstCmd.public ? 'Oui' : 'Non'}\n**Contenu**: ${firstCmd.content ? firstCmd.content.length > 60 ? firstCmd.content.slice(0, 60) + '...' : firstCmd.content : 'Aucun'}\n**Embed**: ${firstCmd.embed ? 'Oui' : 'Non'}\n**Image**: ${firstCmd.image ? 'Oui' : 'Non'}${firstCmd.whitelisted_members ? '\n**Membres autorisés à faire la commande**: ' + firstCmd.whitelisted_members.map((m) => `<@${m}>`).join(', ') : ''}${firstCmd.whitelisted_roles ? '\n**Les personnes ayant le(s) rôle(s) suivant(s) peuvent faire la commande**: ' + firstCmd.whitelisted_roles.map((r) => `<@&${r}>`).join(', ') : '' }${firstCmd.whitelisted_channels ? '\n**La commande peut être faite dans le(s) salon(s) suivant(s)**: ' + firstCmd.whitelisted_channels.map((c) => `<#${c}>`).join(', ') : ''}`;

    const msg = await message.channel.send({ embed });

    const rArr = ['⬅️', '➡️', '❌', '✏️'];
    rArr.forEach((r) => msg.react(r));

    const collector = msg.createReactionCollector((reaction, user) => rArr.includes(reaction.emoji.name) && user.id === message.author.id, { time: 360000 });
    collector.on('collect', async (reaction, user) => {
        reaction.users.remove(user).catch(() => {});

        if(reaction.emoji.name === rArr[0]) {
            if(page - 1 <= 0) return;

            page--;
            const cmd = cData[page - 1];
            embed.title = `Page ${page}/${cData.length}`;
            embed.description = `**__Commande ${cmd.name}__**:\n\n**Activée**: ${cmd.enabled ? enabled : disabled}\n**Affichée dans le help**: ${cmd.public ? 'Oui' : 'Non'}\n**Contenu**: ${cmd.content ? cmd.content.length > 60 ? cmd.content.slice(0, 60) + '...' : cmd.content : 'Aucun'}\n**Embed**: ${cmd.embed ? 'Oui' : 'Non'}\n**Image**: ${cmd.image ? 'Oui' : 'Non'}${cmd.whitelisted_members ? '\n**Membres autorisés à faire la commande**: ' + cmd.whitelisted_members.map((m) => `<@${m}>`).join(', ') : ''}${cmd.whitelisted_roles ? '\n**Les personnes ayant le(s) rôle(s) suivant(s) peuvent faire la commande**: ' + cmd.whitelisted_roles.map((r) => `<@&${r}>`).join(', ') : '' }${cmd.whitelisted_channels ? '\n**La commande peut être faite dans le(s) salon(s) suivant(s)**: ' + cmd.whitelisted_channels.map((c) => `<#${c}>`).join(', ') : ''}`;

            await msg.edit({ embed });
        } else if(reaction.emoji.name === rArr[1]) {
            if(page + 1 > cData.length) return;

            page++;
            const cmd = cData[page - 1];
            embed.title = `Page ${page}/${cData.length}`;
            embed.description = `**__Commande ${cmd.name}__**:\n\n**Activée**: ${cmd.enabled ? enabled : disabled}\n**Affichée dans le help**: ${cmd.public ? 'Oui' : 'Non'}\n**Contenu**: ${cmd.content ? cmd.content.length > 60 ? cmd.content.slice(0, 60) + '...' : cmd.content : 'Aucun'}\n**Embed**: ${cmd.embed ? 'Oui' : 'Non'}\n**Image**: ${cmd.image ? 'Oui' : 'Non'}${cmd.whitelisted_members?.length >= 1 ? '\n**Membres autorisés à faire la commande**: ' + cmd.whitelisted_members.map((m) => `<@${m}>`).join(', ') : ''}${cmd.whitelisted_roles?.length >= 1 ? '\n**Les personnes ayant le(s) rôle(s) suivant(s) peuvent faire la commande**: ' + cmd.whitelisted_roles.map((r) => `<@&${r}>`).join(', ') : '' }${cmd.whitelisted_channels?.length >= 1 ? '\n**La commande peut être faite dans le(s) salon(s) suivant(s)**: ' + cmd.whitelisted_channels.map((c) => `<#${c}>`).join(', ') : ''}`;

            await msg.edit({ embed });
        } else if(reaction.emoji.name === rArr[2]) {
            collector.stop();
            msg.delete().catch(() => {});
        } else if(reaction.emoji.name === rArr[3]) {
            const cmd = cData[page - 1];
            const eArr = {
                '📝': 'Changer le nom',
                '🔓': 'Changer la visibilité',
                '📜': 'Changer le contenu',
                '🟦': `${cmd.embed ? 'Désactiver' : 'Activer'} l'embed`,
                '🖼️': 'Modifier ou retirer l\'image',
                '🗑️': 'Supprimer la commande',
                '❌': 'Annuler'
            };

            msg.delete().then(() => {
                message.channel.send({
                    embed: {
                        color: client.config.embed.color,
                        title: `Editer la commande ${cmd.name}`,
                        description: Object.entries(eArr).map((r) => `${r[0]} ➔ ${r[1]}`).join('\n'),
                        footer: { text: client.config.embed.footer, icon_url: client.user.displayAvatarURL() }
                    }
                }).then((m) => {
                    Object.keys(eArr).forEach((r) => m.react(r).catch(() => {}));
                    const coll = m.createReactionCollector((reaction, user) => Object.keys(eArr).includes(reaction.emoji.name) && user.id === message.author.id, { time: 120000 });
                    coll.on('collect', async (react, usr) => {
                        react.users.remove(usr).catch(() => {});

                        if(react.emoji.name === '📝') {
                            const nameMsg = await message.channel.send('Envoyez le nouveau nom que vous souhaitez attribuer.');
                            const nameColl = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { max: 5, time: 60000 });
                            nameColl.on('collect', (collectedName) => {
                                const name = collectedName.content?.split(' ')?.[0];
                                if(!/[a-z0-9_-]{2,20}/i.test(name)) {
                                    return message.channel.send('⚠️ Le nom de votre commande doit faire entre 2 et 20 caractères et ne peut pas contenir de caractères spéciaux ni d\'espaces.')
                                        .then((_m) => setTimeout(() => _m.delete().catch(() => {}), 5000));
                                }
                        
                                if(cData.some((command) => command.name.toLowerCase() === name.toLowerCase()) || client.commands.find((commd) => commd.help.name.toLowerCase() === name.toLowerCase() || commd.help.aliases.some((alias) => alias.toLowerCase() === name.toLowerCase()))) return message.channel.send('⚠️ Ce nom de commande est déjà pris !');

                                nameColl.stop();

                                collectedName.delete().catch(() => {});
                                nameMsg.delete().catch(() => {});

                                cmd.name = name;
                                cmd.save().then(() => {
                                    message.channel.send('✅ Le nom a bien été modifié.');
                                    return reset();
                                });
                            });

                            nameColl.on('end', (_, reason) => {
                                if(reason === 'time' || reason === 'limit') reset();
                            });
                        } else if(react.emoji.name === '🔓') {
                            if(cmd.public) {
                                cmd.public = false;
                                cmd.markModified('public');

                                cmd.save().then(() => {
                                    message.channel.send(`✅ La commande \`${cmd.name}\` ne sera désormais plus affichée dans la commande \`${data.prefix}help\`.`);

                                    reset();
                                });
                            } else {
                                cmd.public = true;
                                cmd.markModified('public');

                                cmd.save().then(() => {
                                    message.channel.send(`✅ La commande ${cmd.name} est désormais affichée dans la commande \`${data.prefix}help\`!`);

                                    reset();
                                });
                            }                            
                        } else if(react.emoji.name === '📜') {
                            const contentMsg = await message.channel.send(`Quel message voulez-vous envoyez lors de l'éxécution de la commande ? Envoyez \`aucun\` pour ne pas en envoyer.\nTip: Faites \`${data.prefix}vars\` pour voir les différentes possibilité que vous pouvez ajoutez à votre message !`);
                            const contentColl = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { max: 5, time: 120000 });
                            contentColl.on('collect', async (collectedContent) => {
                                if(collectedContent.content?.toLowerCase() === `${data.prefix}vars`) return;

                                let content = null;
                                if(collectedContent.content?.toLowerCase() !== 'aucun') {
                                    if(!collectedContent.content) return message.channel.send('⚠️ Merci de spécifier un contenu valide.');
                                    if(collectedContent.content.length > 2000) return message.channel.send('⚠️ Le contenu ne peut pas faire plus de 2000 caractères !');

                                    content = collectedContent.content;
                                }

                                contentColl.stop();

                                contentMsg.delete().catch(() => {});
                                collectedContent.delete().catch(() => {});

                                cmd.content = content;
                                cmd.markModified('content');

                                cmd.save().then(() => {
                                    message.channel.send(`✅ ${content ? 'Le contenu a bien été sauvegardé' : 'Le contenu a bien été retiré'}.`);

                                    reset();
                                });
                            });

                            contentColl.on('end', (_, reason) => {
                                if(reason === 'time' || reason === 'limit') reset();
                            });
                        } else if(react.emoji.name === '🟦') {
                            if(cmd.embed) {
                                cmd.embed = null;
                                cmd.markModified('embed');

                                cmd.save().then(() => {
                                    message.channel.send('✅ L\'embed a bien été retiré de la commande.');

                                    reset();
                                });
                            } else {
                                client.askEmbed(message).then((embd) => {
                                    cmd.embed = embd;
                                    cmd.markModified('embed');

                                    cmd.save().then(() => {
                                        message.channel.send('✅ Le nouvel embed a bien été sauvegardé.');

                                        reset();
                                    });
                                });
                            }
                        } else if(react.emoji.name === '🖼️') {
                            const imgMsg = await message.channel.send('Envoyez l\'image que vous souhaitez attacher à votre commande.\nSi vous voulez la retirer, envoyez \'aucune\'.');
                            const imgColl = message.channel.createMessageCollector((m) => m.author.id === message.author.id, { max: 5, time: 60000 });
                            imgColl.on('collect', async (collectedImg) => {
                                let image = null;
                                if(collectedImg.content?.toLowerCase() !== 'aucune') {
                                    image = collectedImg.attachments.first()?.url;
                                    if(!image) return message.channel.send('Merci d\'envoyer une image !');
                                }

                                imgColl.stop();

                                imgMsg.delete().catch(() => {});

                                cmd.image = image;
                                cmd.markModified('image');

                                cmd.save().then(() => {
                                    message.channel.send(`✅ L'image a bien été ${image ? 'sauvegardé' : 'retirée'}.`);

                                    reset();
                                });
                            });

                            imgColl.on('end', (_, reason) => {
                                if(reason === 'time' || reason === 'limit') reset();
                            });
                        } else if(react.emoji.name === '🗑️') {
                            cmd.delete().then(() => {
                                message.channel.send(`✅ La commande ${cmd.name} a bien été supprimée.`);

                                reset();
                            });
                        } else if(react.emoji.name === '❌') {
                            reset();
                        }
                    });

                    coll.on('end', (_, reason) => {
                        if(reason === 'time') reset();
                    });

                    function reset() {
                        coll.stop();
                        m.delete().catch(() => {});
                        return client.commands.get('custom-commands').run(client, message, args, data);
                    }
                });
            }).catch(() => {});
        }
    });

    collector.on('end', (_, reason) => {
        if(reason === 'time') msg.reactions.removeAll().catch(() => {});
    });
}

module.exports.help = {
    name: "custom-commands",
    aliases: ["custom-commands", "customcommands", "customs-commands", "customscommands", "customcommand", "custom-command"],
    category: 'Config',
    description: "Voir et modifier les commandes custom du serveur.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD", "EMBED_LINKS"],
    botPerms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "EMBED_LINKS"],
    args: false
}