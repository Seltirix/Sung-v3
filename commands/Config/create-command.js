const Command = require('../../models/Command');

module.exports.run = async (client, message, args, data) => {
    const cData = await Command.find({ guildID: message.guild.id })
    if(cData.length >= 10) return message.channel.send('⚠️ Vous ne pouvez pas créer plus de 10 commandes par serveur !');

    const nameMsg = await message.channel.send('Quel nom souhaitez-vous donner à votre commande ?');
    const filter = (m) => m.author.id === message.author.id;
    const rArr = ['✅', '❌'];
    const rFilter = (reaction, user) => rArr.includes(reaction.emoji.name) && user.id === message.author.id;
    const nameCollector = message.channel.createMessageCollector(filter, { max: 5, time: 60000 });
    nameCollector.on('collect', async (collectedName) => {
        const name = collectedName.content?.split(' ')?.[0];
        if(!/[a-z0-9_-]{2,20}/i.test(name)) {
            return message.channel.send('⚠️ Le nom de votre commande doit faire entre 2 et 20 caractères et ne peut pas contenir de caractères spéciaux ni d\'espaces.')
                .then((m) => setTimeout(() => m.delete().catch(() => {}), 5000));
        }

        if(cData.some((command) => command.name.toLowerCase() === name.toLowerCase()) || client.commands.find((command) => command.help.name.toLowerCase() === name.toLowerCase() || command.help.aliases.some((alias) => alias.toLowerCase() === name.toLowerCase()))) return message.channel.send('⚠️ Ce nom de commande est déjà pris !');
        collectedName.delete().catch(() => {});

        nameCollector.stop();

        collectedName.delete().catch(() => {});
        nameMsg.delete().catch(() => {});

        const public = await message.channel.send(`Voulez-vous que cette commande soit affichée dans la commande \`${data.prefix}help\`?`);

        rArr.forEach((r) => public.react(r));
        public.awaitReactions(rFilter, { max: 1, time: 60000 })
            .then(async (collectedPublic) => {
                if(!collectedPublic.first()) {
                    public.delete().catch(() => {});
                    return message.channel.send('⚠️ Merci de faire votre choix avec les réactions ! Commande annulée.');
                }

                public.delete().catch(() => {});

                const contentMsg = await message.channel.send(`Quel message voulez-vous envoyez lors de l'éxécution de la commande ? Envoyez \`aucun\` pour ne pas en envoyer.\nTip: Faites \`${data.prefix}vars\` pour voir les différentes possibilité que vous pouvez ajoutez à votre message !`);
                const contentCollector = message.channel.createMessageCollector(filter, { max: 5, time: 120000 });
                contentCollector.on('collect', async (collectedContent) => {
                    if(collectedContent.content?.toLowerCase() === `${data.prefix}vars`) return;
                    let content = null;
                    if(collectedContent.content?.toLowerCase() !== 'aucun') {
                        if(!collectedContent.content) return message.channel.send('⚠️ Merci de spécifier un contenu valide.');
                        if(collectedContent.content.length > 2000) return message.channel.send('⚠️ Le contenu ne peut pas faire plus de 2000 caractères !');

                        content = collectedContent.content;
                    }

                    contentCollector.stop();

                    contentMsg.delete().catch(() => {});
                    collectedContent.delete().catch(() => {});

                    const embedMsg = await message.channel.send('Voulez-vous ajouter un embed à votre commande ?');
                    rArr.forEach((r) => embedMsg.react(r));
                    embedMsg.awaitReactions(rFilter, { max: 1, time: 60000 })
                        .then(async (collectedEmbed) => {
                            if(!collectedEmbed.first()) {
                                embedMsg.delete().catch(() => {});
                                return message.channel.send('⚠️ Merci de faire votre choix avec les réactions ! Commande annulée.');
                            }

                            embedMsg.delete().catch(() => {});

                            if(collectedEmbed.first().emoji.name === rArr[0]) {
                                client.askEmbed(message).then(async (embed) => {
                                    await nextAfterEmbed(name, collectedPublic.first().emoji.name, content, embed);
                                });
                            } else if(collectedEmbed.first().emoji.name === rArr[1]) {
                                await nextAfterEmbed(name, collectedPublic.first().emoji.name, content, null);
                            }
                        })
                        .catch(() => message.channel.send('❌ Temps écoulé.'));
                });

                contentCollector.on('end', (_, reason) => {
                    if(reason === 'time') return message.channel.send('⚠️ Vous avez mis trop de temps à repondre!');
                    if(reason === 'limit') return message.channel.send('⚠️ Vous avez fait trop d\'essais, veuillez réessayer.');
                });
            })
            .catch(() => message.channel.send('❌ Temps écoulé.'));
    });

    nameCollector.on('end', (_, reason) => {
        if(reason === 'time') return message.channel.send('⚠️ Vous avez mis trop de temps à repondre!');
        if(reason === 'limit') return message.channel.send('⚠️ Vous avez fait trop d\'essais, veuillez réessayer.');
    });

    async function nextAfterEmbed(name, public, content, embed) {
        const imageMsg = await message.channel.send('Voulez-vous attacher une image à votre commande ?');
        rArr.forEach((r) => imageMsg.react(r));
        imageMsg.awaitReactions(rFilter, { max: 1, time: 60000 })
            .then(async (collectedImage) => {
                if(!collectedImage.first()) {
                    imageMsg.delete().catch(() => {});
                    return message.channel.send('⚠️ Merci de faire votre choix avec les réactions ! Commande annulée.');
                }

                imageMsg.delete().catch(() => {});

                let image = null;
                if(collectedImage.first().emoji.name === rArr[0]) {
                    const imgMsg = await message.channel.send('Envoyez l\'image que vous souhaitez attacher à votre commande.');
                    const imgCollector = message.channel.createMessageCollector(filter, { max: 5, time: 60000 });
                    imgCollector.on('collect', async (collectedImg) => {
                        image = collectedImg.attachments.first()?.url;
                        if(!image) return message.channel.send('Merci d\'envoyer une image !');

                        imgCollector.stop();

                        imgMsg.delete().catch(() => {});

                        await nextAfterImage();
                    });

                    imgCollector.on('end', (_, reason) => {
                        if(reason === 'time') return message.channel.send('⚠️ Vous avez mis trop de temps à repondre!');
                        if(reason === 'limit') return message.channel.send('⚠️ Vous avez fait trop d\'essais, veuillez réessayer.');
                    });
                } else if(collectedImage.first().emoji.name === rArr[1]) {
                    await nextAfterImage();
                }

                async function nextAfterImage() {
                    const wlMembersMsg = await message.channel.send('Quels membres pourront faire cette commande ? Mentionnez les @Membre1 @Membre2... Si vous ne voulez pas en mettre, envoyez \'aucun\'.');
                    const wlMembersCollector = message.channel.createMessageCollector(filter, { max: 5, time: 60000 });
                    wlMembersCollector.on('collect', async (collectedMembers) => {
                        let whitelisted_members = null;
                        if(collectedMembers.content?.toLowerCase() === 'aucun') {
                            collectedMembers.delete().catch(() => {});
                            wlMembersMsg.delete().catch(() => {});

                            wlMembersCollector.stop();
                        } else {
                            if(collectedMembers.mentions.members.filter((m) => m.id === message.author.id).size < 1) return message.channel.send('⚠️ Merci de mentionner au moins une personne!');
                            whitelisted_members = collectedMembers.mentions.members.filter((m) => m.id !== message.author.id).array().map((m) => m.id);
                            whitelisted_members.push(message.author.id);
                        }

                        collectedMembers.delete().catch(() => {});
                        wlMembersMsg.delete().catch(() => {});

                        wlMembersCollector.stop();

                        const wlRolesMsg = await message.channel.send('Quels rôles pourront faire cette commande ? Mentionnez les @Role1 @Role2... Si vous voulez que tout le monde puisse faire la commande, envoyez \'aucun\'.');
                        const wlRolesCollector = message.channel.createMessageCollector(filter, { max: 5, time: 60000 });
                        wlRolesCollector.on('collect', async (collectedRoles) => {
                            let whitelisted_roles = null;
                            if(collectedRoles.content?.toLowerCase() === 'aucun') {
                                collectedRoles.delete().catch(() => {});
                                wlRolesMsg.delete().catch(() => {});

                                wlRolesCollector.stop();
                            } else {
                                if(collectedRoles.mentions.roles.size < 1) return message.channel.send('⚠️ Merci de mentionner au moins un rôle!');
                                if(!collectedRoles.mentions.roles.some((r) => !message.member.roles.cache.has(r))) return message.channel.send('⚠️ Vous devez spécifiez au moins 1 rôle que vous avez !');
                                whitelisted_roles = collectedRoles.mentions.roles.array().map((r) => r.id);
                            }

                            collectedRoles.delete().catch(() => {});
                            wlRolesMsg.delete().catch(() => {});

                            wlRolesCollector.stop();

                            const wlChannelsMsg = await message.channel.send('Dans quels salons pourront être faits la commande ? Mentionnez les #Salon1 #Salon2... Si vous voulez qu\'elle soit disponible dans tous les salons, envoyez \'aucun\'.');
                            const wlChannelsCollector = message.channel.createMessageCollector(filter, { max: 5, time: 60000 });
                            wlChannelsCollector.on('collect', (collectedChannels) => {
                                let whitelisted_channels = null;
                                if(collectedChannels.content?.toLowerCase() === 'aucun') {
                                    collectedChannels.delete().catch(() => {});
                                    wlChannelsMsg.delete().catch(() => {});

                                    wlChannelsCollector.stop();
                                } else {
                                    if(collectedChannels.mentions.channels.size < 1) return message.channel.send('⚠️ Merci de mentionner au moins un salon!');
                                    if(collectedChannels.mentions.channels.some((c) => !message.guild.me.permissionsIn(c).has(['SEND_MESSAGES', 'READ_MESSAGE_HISTORY']))) return message.channel.send('⚠️ Je n\'ai pas la permissions d\'envoyer de messages de l\'un des salons mentionnés !');
                                    whitelisted_channels = collectedChannels.mentions.channels.array().map((c) => c.id);
                                }

                                collectedChannels.delete().catch(() => {});
                                wlChannelsMsg.delete().catch(() => {});

                                wlChannelsCollector.stop();

                                new Command({
                                    _id: require('mongoose').Types.ObjectId(),
                                    guildID: message.guild.id,
                                    name,
                                    public: public === '✅',
                                    content,
                                    embed,
                                    image,
                                    whitelisted_members,
                                    whitelisted_roles,
                                    whitelisted_channels
                                }).save().then(() => {
                                    message.channel.send('✅ La commande a bien été créé !');
                                }).catch((err) => {
                                    console.error(err);
                                    message.channel.send('❌ Une erreur est survenue pendant la création de la commande.');
                                    client.channels.cache.get(client.config.support.logs).send('Save error:\n```' + err + '```');
                                });
                            });

                            wlChannelsCollector.on('end', (_, reason) => {
                                if(reason === 'time') return message.channel.send('⚠️ Vous avez mis trop de temps à repondre!');
                                if(reason === 'limit') return message.channel.send('⚠️ Vous avez fait trop d\'essais, veuillez réessayer.');
                            });
                        });

                        wlRolesCollector.on('end', (_, reason) => {
                            if(reason === 'time') return message.channel.send('⚠️ Vous avez mis trop de temps à repondre!');
                            if(reason === 'limit') return message.channel.send('⚠️ Vous avez fait trop d\'essais, veuillez réessayer.');
                        });
                    });
                }
            })
            .catch(() => message.channel.send('❌ Temps écoulé.'));
    }
}

module.exports.help = {
    name: "create-command",
    aliases: ["create-command", "createcommand", "create-commande", "createcommande"],
    category: 'Config',
    description: "Créer une commande personnalisée sur le serveur.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD", "EMBED_LINKS"],
    botPerms: ["ADD_REACTIONS", "MANAGE_MESSAGES", "EMBED_LINKS"],
    args: false
}
