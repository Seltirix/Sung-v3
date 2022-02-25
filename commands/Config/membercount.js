module.exports.run = async (client, message, args, data) => {
    if(args[0].toLowerCase() === 'create') {
        if(data.plugins.membercount?.parentID && message.guild.channels.resolve(data.plugins.membercount?.parentID)) {
            return message.channel.send(`⚠️ Les salons compteur de membre existent déjà ! Faites \`${data.prefix}membercount delete\` pour le retirer`);
        } else {
            if(message.guild.channels.cache.size > 495) return message.channel.send('⚠️ Vous avez atteint la limite de salon (500). Je ne peux pas en créer tant qu\'il y en a plus que 495.');
            if(message.guild.memberCount !== message.guild.members.cache.size) await message.guild.members.fetch();

            const prompts = [
                'Quel nom souhaitez vous donner aux salons de membres (humains) ?\nExemple: `👨 Humains: {count}`',
                'Quel nom souhaitez vous donner aux salons de membres (bots) ?\nExemple: `🤖 Bots: {count}`',
                'Quel nom souhaitez vous donner aux salons de membres (total) ?\nExemple: `🌎 Total: {count}`'
            ];
            const filter = (m) => m.author.id === message.author.id;

            const membersChannelText = await message.channel.send(prompts[0]);

            message.channel.awaitMessages(filter, { time: 30000, max: 1 })
                .then(async (membersChannelName) => {
                    if(!membersChannelName.first().content) return message.channel.send('⚠️ Merci de spécifier un nom.');
                    if(!membersChannelName.first().content.includes('{count}')) return message.channel.send('⚠️ Vous devez mettre la balise de nombre de membre `{count}`. Sans elle, les salons compteurs ne serviraient à rien...');

                    membersChannelName.first().delete().catch(() => {});
                    membersChannelText.delete().catch(() => {});

                    const botsChannelText = await message.channel.send(prompts[1]);

                    message.channel.awaitMessages(filter, { time: 30000, max: 1 })
                        .then(async (botsChannelName) => {
                            if(!botsChannelName.first().content) return message.channel.send('⚠️ Merci de spécifier un nom.');
                            if(!botsChannelName.first().content.includes('{count}')) return message.channel.send('⚠️ Vous devez mettre la balise de nombre de membre `{count}`. Sans elle, les salons compteurs ne serviraient à rien...');

                            botsChannelName.first().delete().catch(() => {});
                            botsChannelText.delete().catch(() => {});

                            const totalChannelText = await message.channel.send(prompts[2]);

                            message.channel.awaitMessages(filter, { time: 30000, max: 1 })
                                .then(async (totalChannelName) => {
                                    if(!totalChannelName.first().content) return message.channel.send('⚠️ Merci de spécifier un nom.');
                                    if(!totalChannelName.first().content.includes('{count}')) return message.channel.send('⚠️ Vous devez mettre la balise de nombre de membre `{count}`. Sans elle, les salons compteurs ne serviraient à rien...');

                                    totalChannelName.first().delete().catch(() => {});
                                    totalChannelText.delete().catch(() => {});

                                    try {
                                        const parent = await message.guild.channels.create('Stats du serveur', {
                                            type: 'category',
                                            permissionOverwrites: [
                                                {
                                                    id: message.guild.roles.everyone.id,
                                                    allow: ['VIEW_CHANNEL'],
                                                    deny: ['CONNECT']
                                                },
                                                {
                                                    id: client.user.id,
                                                    allow: ['VIEW_CHANNEL', 'MANAGE_CHANNELS']
                                                }
                                            ],
                                            position: 0
                                        });

                                        const membersChannel = await message.guild.channels.create(membersChannelName.first().content.replace('{count}', message.guild.members.cache.filter(m => !m.user.bot).size), {
                                            type: 'voice',
                                            parent
                                        });

                                        const botsChannel = await message.guild.channels.create(botsChannelName.first().content.replace('{count}', message.guild.members.cache.filter(m => m.user.bot).size), {
                                            type: 'voice',
                                            parent
                                        });

                                        const totalChannel = await message.guild.channels.create(totalChannelName.first().content.replace('{count}', message.guild.memberCount), {
                                            type: 'voice',
                                            parent
                                        });

                                        data.plugins.membercount = {
                                            channels: {
                                                members: {
                                                    name: membersChannelName.first().content,
                                                    id: membersChannel.id
                                                },
                                                bots: {
                                                    name: botsChannelName.first().content,
                                                    id: botsChannel.id
                                                },
                                                totalMembers: {
                                                    name: totalChannelName.first().content,
                                                    id: totalChannel.id
                                                }
                                            },
                                            parentID: parent.id
                                        };
                                        data.markModified("plugins.membercount");

                                        await data.save();

                                        message.channel.send('✅ Les salons de compteur de membre ont bien été mis en place.');
                                    } catch (e) {
                                        console.error(e);
                                        client.channels.cache.get(client.config.support.logs).send(`Une erreur est survenue lors de la commande membercount: \n\`\`\`${e.stack}\`\`\``);
                                        return message.channel.send(`Une erreur est survenue lors de la création des salons: \n\`\`\`${e.message}\`\`\``);
                                    }
                                })
                                .catch(() => message.channel.send('Temps écoulé'));
                        })
                        .catch(() => message.channel.send('Temps écoulé'));
                })
                .catch(() => message.channel.send('Temps écoulé'));
        }
    } else if(args[0].toLowerCase() === 'delete') {
        if(!data.plugins.membercount?.parentID || !message.guild.channels.resolve(data.plugins.membercount?.parentID)) return message.channel.send(`⚠️ Les salons de compteur de membres ne sont pas activés sur ce serveur, faites \`${data.prefix}membercount create\` pour les créer !`);

        const channels = Object.values(data.plugins.membercount.channels);

        if(channels.filter((ch) => message.guild.channels.cache.get(ch.id)).some((channel) => !message.guild.me.permissionsIn(channel.id).has(['VIEW_CHANNEL', 'MANAGE_CHANNELS']))) return message.channel.send('⚠️ Je n\'ai pas les permissions de supprimer l\'un des salons vocaux de compteur de membres.');
        const deleteChannel = (channel) => setTimeout(async () => await message.guild.channels.cache.get(channel).delete().catch(() => {}), 1000);

        deleteChannel(data.plugins.membercount.parentID);
        channels.forEach((channel) => deleteChannel(channel.id));

        setTimeout(async () => {
            let notDeleted = 0;
            Object.values(data.plugins.membercount.channels).forEach((chnl) => {
                const ch = message.guild.channels.cache.get(chnl.id);
                if(ch && !ch.deleted) notDeleted++;
            });
    
            data.plugins.membercount = {
                channels: {
                    members: {
                        name: null,
                        id: null
                    },
                    bots: {
                        name: null,
                        id: null
                    },
                    totalMembers: {
                        name: null,
                        id: null
                    }
                },
                parentID: null
            };
            data.markModified("plugins.membercount");
    
            await data.save();
            if(notDeleted >= 1) return message.channel.send(`⚠️ Je n'ai pas réussi à supprimer ${notDeleted} salon sur 4.`);
            else message.channel.send('✅ Les salons de compteur de membres ont été supprimés.');
        }, 1500);
    } else message.channel.send(`⚠️ Vous n'utilisez pas la commande correctement.\nFaites \`${data.prefix}membercount create\` pour créer le compteur de membre, et \`${data.prefix}membercount delete\` pour le supprimer.`);
}

module.exports.help = {
    name: "membercount",
    aliases: ["membercount", "counter", "member-count"],
    category: 'Config',
    description: "Configurer le salon de compteur de membres.",
    usage: "<create | delete>",
    cooldown: 10,
    memberPerms: ["MANAGE_CHANNELS"],
    botPerms: ["MANAGE_CHANNELS"],
    args: true
}
