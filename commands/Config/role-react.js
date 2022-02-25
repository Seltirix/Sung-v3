const { Message } = require('discord.js');
const RolesReactions = require('../../models/RolesReactions');

module.exports.run = async (client, message) => {
    const data = await RolesReactions.find({ guildID: message.guild.id });
    const action = await message.channel.send('Voulez-vous `créer`, `ajouter` ou `supprimer` un rôle réaction ?');
    const filter = (m) => m.author.id === message.author.id;

    message.channel.awaitMessages(filter, { time: 30000, max: 1 })
        .then(async (collectedAction) => {
            const content = collectedAction.first()?.content?.toLowerCase();
            if(!content) return message.channel.send('⚠️ Merci de spécifier une action entre `créer`, `ajouter` ou `supprimer`');

            action.delete().catch(() => {});
            collectedAction.first().delete().catch(() => {});

            if(['créer', 'creer', 'crér', 'crer', 'create'].includes(content)) {
                if(data.length >= 10) return message.channel.send('⚠️ Vous avez atteint la limite de 10 panels de rôles réactions. Pour mettre plusieurs rôles réactions sur un panel, utilisez `ajouter`.');

                await askForRoleReact('create', async (role, emoji, title) => {
                    const msg = await message.channel.send({
                        embed: {
                            color: client.config.embed.color,
                            title,
                            description: `${emoji.id ? `<:${emoji.name}:${emoji.id}>` : emoji.name} | ${role}`,
                            footer: { text: message.guild.name + ' - Rôles réactions', icon_url: message.guild.iconURL({ dynamic: true }) }
                        }
                    });

                    msg.react(emoji.id || emoji.name);

                    await new RolesReactions({
                        _id: client.mongoose.Types.ObjectId(),
                        guildID: message.guild.id,
                        messageID: msg.id,
                        roles_react: [{ emoji: emoji.id || emoji.name, role: role.id }]
                    }).save();
                });
            } else if(['ajouter', 'add', 'ajouté', 'ajoute'].includes(content)) {
                await askForRoleReact('add', async (pRole, pMsg, pEmoji) => {
                    const found = data.find((msg) => msg.messageID === pMsg.id);
                    if(!found) return message.channel.send('⚠️ Le panel n\'a pas été trouvé, assurez-vous que vous êtes bien dans le salon ou il y a le panel en question.');
                    if(found.roles_react.find(({ role }) => role === pRole.id)) return message.channel.send('⚠️ Ce rôle est déjà présent sur ce panel!');
                    if(found.roles_react.find(({ emoji }) => emoji === pEmoji.id || emoji === pEmoji.name)) return message.channel.send('⚠️ Cet emoji est déjà présent sur ce panel!');

                    pMsg.embeds[0].description += `\n${pEmoji.id ? `<:${pEmoji.name}:${pEmoji.id}>` : pEmoji.name} | ${pRole}`,
                    pMsg.edit({ embed: pMsg.embeds[0] });
                    await pMsg.react(pEmoji.id || pEmoji.name);

                    found.roles_react.push({ emoji: pEmoji.id || pEmoji.name, role: pRole.id });
                    await found.save();
                });
            } else if(['supprimer', 'supprimé', 'supprime', 'delete'].includes(content)) {
                const asked = await message.channel.send('Quel est l\'ID du message auquel vous voulez supprimer le panel ?');

                message.channel.awaitMessages(filter, { time: 30000, max: 1 })
                    .then(async (collectedMsg) => {
                        const sent = collectedMsg.first()?.content?.toLowerCase();
                        if(!sent) return message.channel.send('Merci de spécifier l\'id d\'un message!');

                        const msg = await message.channel.messages.fetch(sent).catch(() => {});
                        const found = data.find((doc) => doc.messageID === sent);
                        if(!found) return message.channel.send('⚠️ Aucun rôle réaction trouvé avec cet ID.');

                        await found.delete();
                        msg.delete().catch(() => {});
                        asked.delete().catch(() => {});
                        collectedMsg.first().delete().catch(() => {});

                        message.channel.send('Le panel a bien été supprimé.');
                    })
                    .catch(console.error);
            } else {
                return message.channel.send('⚠️ Merci de spécifier une action entre `créer`, `ajouter` ou `retirer`');
            }
        })
        .catch(() => message.channel.send('Temps écoulé'));

    const askForRoleReact = async (act, callback) => {
        const prompts = [
            'Quel rôle voulez-vous donner en cliquant sur la réaction ?',
            'Quel emoji voulez-vous associer au rôle comme réaction ?\nRéagissez à ce message avec l\'emoji voulu!',
            'Quel est l\'ID du message auquel vous voulez ajouter le rôle réaction ?',
            'Quel titre voulez-vous donner à votre panel ?'
        ];

        const one = await message.channel.send(prompts[0]);

        message.channel.awaitMessages(filter, { time: 60000, max: 1 })
            .then(async (collectedRole) => {
                const sent = collectedRole.first()?.content;
                if(!sent) return message.channel.send('⚠️ Merci de spécifier un rôle à donner!');

                const role = collectedRole.first().mentions.roles.first() || message.guild.roles.cache.get(sent) || message.guild.roles.cache.find((r) => r.name.toLowerCase().includes(sent));
                if(!message.guild.roles.cache.get(role?.id) || role.id === message.guild.roles.everyone.id) return message.channel.send('⚠️ Rôle invalide, réessayer en le mentionnant ou en donnant son ID.');
                if(message.author.id !== message.guild.ownerID && message.member.roles.highest.position <= role.position) return message.channel.send('⚠️ Vous n\'avez pas les permissions nécessaires pour ajouter ce rôle aux autres membres');
                if(message.guild.me.roles.highest.position <= role.position || !role.editable) return message.channel.send('⚠️ Je n\'ai pas les permissions nécessaires pour donner ce rôle aux autres membres.');

                if(act === 'add' && data.length < 1) return message.channel.send('⚠️ Vous n\'avez aucun rôles réactions sur le serveur.');

                one.delete().catch(() => {});
                collectedRole.first().delete().catch(() => {})

                const two = await message.channel.send(prompts[1]);

                two.awaitReactions((_, user) => user.id === message.author.id, { time: 60000, max: 1 })
                    .then(async (collectedEmoji) => {
                        const emoji = collectedEmoji.first()?.emoji;
                        if(!emoji) return message.channel.send('⚠️ Merci de réagir avec un emoji valide !');
                        if(emoji.id && !message.guild.emojis.cache.get(emoji.id)) return message.channel.send('⚠️ Merci de me donner un emoji présent sur le serveur !');

                        two.delete().catch(() => {});

                        if(act === 'add') {
                            const three = await message.channel.send(prompts[2]);

                            message.channel.awaitMessages(filter, { time: 60000, max: 1 })
                                .then(async (collectedMsg) => {
                                    const id = collectedMsg.first()?.content;
                                    if(!id) return message.channel.send('⚠️ Merci de spécifier l\'id d\'un message!');

                                    const msg = await message.channel.messages.fetch(id).catch(() => {})
                                    if(!data.find((doc) => doc.messageID === id) || !(msg instanceof Message)) return message.channel.send('⚠️ Aucun rôle réaction trouvé avec cet ID.');
                                    if(data.find((doc) => doc.messageID === id).roles_react.length >= 15) return message.channel.send('⚠️ Vous avez atteint la limite de 15 rôles réactions par panel!');

                                    three.delete().catch(() => {});
                                    collectedMsg.first().delete().catch(() => {});

                                    await callback(role, msg, emoji);
                                })
                                .catch(() => message.channel.send('Temps écoulé'));
                        } else {
                            const three = await message.channel.send(prompts[3]);

                            message.channel.awaitMessages(filter, { time: 60000, max: 1 })
                                .then(async (collectedTitle) => {
                                    const title = collectedTitle.first()?.content;
                                    if(!title) return message.channel.send('⚠️ Merci de spécifier un titre!');

                                    if(title.length > 250) return message.channel.send('⚠️ Le titre ne doit pas faire plus de 250 caractères.');

                                    three.delete().catch(() => {});
                                    collectedTitle.delete().catch(() => {});

                                    await callback(role, emoji, title);
                                })
                                .catch(() => message.channel.send('Temps écoulé'));
                        }
                    })
                    .catch(() => message.channel.send('Temps écoulé'));
            });
    }
}

module.exports.help = {
    name: "role-react",
    aliases: ["role-react", "rolereact", "roles-reacts", "rolesreacts", "roles-reactions", "roles-reactions", "roles-react", "rolesreact"],
    category: 'Config',
    description: "Créer ou modifier un panel rôles réactions.",
    usage: "",
    cooldown: 5,
    memberPerms: ["MANAGE_GUILD"],
    botPerms: ["EMBED_LINKS", "MANAGE_ROLES", "MANAGE_MESSAGES"],
    args: false
}
