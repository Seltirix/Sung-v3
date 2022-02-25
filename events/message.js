const Discord = require('discord.js');
const Guild = require('../models/Guild');
const ms = require('ms');
let _cooldowns = {};
let _users = new Map();

module.exports = async (client, message) => {
    if(message.channel.type === 'dm' || message.author.bot) return;

    if(!message.member) await message.guild.members.fetch(message.author.id);
    if(message.member === null) return;

    if(message.content.includes(client.token)) {
        return message.delete().then(() => client.users.cache.get(client.config.owner.id).send('Tu devrais regen ton token. C\'est juste un conseil.'));
    }

    const dbUser = await client.findOrCreateUser(message.author);

    const data = await client.getGuild(message.guild);
    if(!data) {
        client.emit("guildCreate", message.guild);

        const welcomeEmbed = new Discord.MessageEmbed()
            .setColor(client.config.embed.color)
            .setTitle('Merci de m\'avoir ajouté à votre serveur !')
            .setDescription(`@Mentionnez-moi pour avoir de l'aide !`)
            .setFooter(client.config.embed.footer, client.user.displayAvatarURL())
        return message.channel.send(welcomeEmbed).catch(() => {});
    }

    const p = data.members.map(m => m.id).indexOf(message.author.id);
    const userData = data.members[p];

    if(message.guild && p == -1) {
        await Guild.updateOne({
            id: message.guild.id
        },
        { 
            $push: {
                members: {
                    id: message.member.id,
                    exp: 0,
                    level: 0
                }
            }
        });
    }

    if(typeof message.content !== 'string') return;

    if(data.plugins.protection.antispam?.enabled) {
        if(!data.plugins.protection.ignored_channels?.includes(message.channel.id)) {
            if(!message.member.roles.cache.array().some((role, i) => role.id === (data.plugins.protection.ignored_roles ? data.plugins.protection.ignored_roles[i] : null))) {
                if(!message.member.hasPermission("MANAGE_MESSAGES")) {
                    if(_users.has(message.author.id)) {
                        const user = _users.get(message.author.id);

                        if(!(((message.createdTimestamp - user.lastMessage.createdTimestamp) < 3000) && user.messages.length > 5)) {
                            user.messages.push(message);
                            user.lastMessage = message;

                            if(user.messages.length === 4) {
                                dbUser.warns.push({ guildID: message.guild.id, reason: 'Spam', moderator: client.user.id });

                                dbUser.markModified("warns");
                                dbUser.save();

                                message.author.send(`Vous avez été warn pour **Spam** sur ${message.guild.name}. Si vous continuez, vous sera automatiquement rendu muet.`);

                                if(data.plugins.logs.enabled) {
                                    if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
                                        const embed = new Discord.MessageEmbed()
                                            .setColor('ORANGE')
                                            .setDescription(`L'utilisateur **${message.author.username}** s'est fait avertir pour **Spam**. Il possède désormais ${dbUser.warns.length} warn(s).`)
                                            .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
                                        message.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
                                    }
                                }
                            } else if(user.messages.length >= 6) {
                                dbUser.tempmutes.push({ guildID: message.guild.id, reason: "Spam", moderator: client.user.id, duration: ms(ms(60 * 60 * 1000)), endsAt: (Date.now() + ms(60 * 60 * 1000)) });

                                dbUser.markModified("tempmutes");
                                dbUser.save();

                                message.author.send(`Vous avez été rendu muet pendant **1h** pour **Spam** sur ${message.guild.name}.`).catch(() => {});

                                if(data.muterole) {
                                    await message.member.roles.add(data.muterole);
                                } else {
                                    await message.guild.roles.create({
                                        data: {
                                            name: "Muted",
                                            color: "#000000",
                                            permissions: [],
                                            position: message.guild.member(client.user).roles.highest.position,
                                            mentionnable: false
                                        }
                                    }).then(async (muterole) => {
                                        await client.updateGuild(message.guild, { muterole: muterole.id });

                                        message.guild.channels.cache.forEach(channel => {
                                            if(!message.guild.me.permissionsIn(channel).has("MANAGE_CHANNELS")) return;
                                            channel.updateOverwrite(role, {
                                                SEND_MESSAGES: false,
                                                ADD_REACTIONS: false,
                                                CONNECT: false,
                                            });
                                        });
                            
                                        await member.roles.add(role).then(() => {
                                            message.channel.send(`✅ ${user} s'est fait mute par ${message.author} pour la raison suivante: **${reason}**`);
                                        }).catch(() => {});
                                    }).catch(() => {});
                                }

                                if(data.plugins.logs.enabled) {
                                    if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
                                        const embed = new Discord.MessageEmbed()
                                            .setColor('ORANGE')
                                            .setDescription(`L'utilisateur **${message.author.username}** s'est fait mute 1h pour **Spam**.`)
                                            .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
                                        message.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
                                    }
                                }
                            }

                            setTimeout(() => user.messages.pop(), 10000);
                        }
                    } else {
                        _users.set(message.author.id, {
                            messages: [],
                            lastMessage: message
                        });
                    }       
                }
            }
        }
    }

    if(data.plugins.protection.antimaj) {
        if(!data.plugins.protection.ignored_channels?.includes(message.channel.id)) {
            if(!message.member.roles.cache.array().some((role, i) => role.id === (data.plugins.protection.ignored_roles ? data.plugins.protection.ignored_roles[i] : null))) {
                if(!message.member.hasPermission('MANAGE_MESSAGES')) {
                    let text = message.content.split('');
                    let upperCaseLetters = 0;
                    const validchars = 'abcdefghigklmnopqerstuvwxyz';

                    for (let i = 0; i < text.length; i++) {
                        if (text[i] === text[i].toUpperCase() && (validchars.includes(text[i].toLowerCase()) || validchars.toUpperCase().includes(text[i].toUpperCase()))) {
                            upperCaseLetters++
                        }
                    }

                    if(text.length > 5) {
                        if(upperCaseLetters * (1000 / text.length) >= 500) {
                            message.delete().catch(() => {});

                            dbUser.warns.push({ guildID: message.guild.id, reason: 'Excessive caps', moderator: client.user.id });

                            dbUser.markModified("warns");
                            dbUser.save();

                            message.author.send(`Vous avez été averti sur ${message.guild.name} pour **Excessive caps**.`).catch(() => {});

                            if(data.plugins.logs.enabled) {
                                if(message.guild.channels.cache.get(data.plugins.logs.channel)) {
                                    const embed = new Discord.MessageEmbed()
                                        .setColor('ORANGE')
                                        .setDescription(`L'utilisateur **${message.author.username}** s'est fait avertir pour **Excessive caps**. Il possède désormais ${dbUser.warns.length} warn(s).`)
                                        .setFooter(client.config.embed.footer, client.user.displayAvatarURL());
                                    message.guild.channels.cache.get(data.plugins.logs.channel).send(embed);
                                }
                            }
                        }
                    }
                }
            }
        }
    }    

    if(data.plugins.levels.enabled) {
        if(!(_cooldowns[message.author.id] > Date.now())) {
            _cooldowns[message.author.id] = Date.now() + 1500 * 60; // 1:30 minute cooldown
    
            if(userData) {
                const generated = Math.floor(Math.random() * (25 - 15 + 1) + 15); // generate a random number between 15 and 25
                const newExp = userData.exp + generated;
                const newLevel = userData.level + 1

                await client.updateUserLevel(message.author, message.guild, { "members.$.exp": newExp });

                if((5 * (Math.pow(userData.level, 2)) + 50 * userData.level + 100 - newExp) <= 0) { // check if necessary xp to level up is achieved
                    await client.updateUserLevel(message.author, message.guild, { "members.$.level": newLevel });

                    const level_up_channel = data.plugins.levels.level_up_channel;
                    if(level_up_channel && message.guild.channels.cache.get(level_up_channel)) {
                        message.guild.channels.cache.get(level_up_channel).send(client.formatLevelUpMessage(data.plugins.levels.level_up_message ? data.plugins.levels.level_up_message : 'GG {user} ! Tu passes niveau {level} !', message.author, { level: newLevel, exp: newExp })).catch(() => {});
                    } else {
                        message.channel.send(client.formatLevelUpMessage(data.plugins.levels.level_up_message ? data.plugins.levels.level_up_message : 'GG {user} ! Tu passes niveau {level} !', message.author, { level: newLevel, exp: newExp })).catch(() => {});
                    }

                    // give role rewards
                    const giveRole = data.plugins.levels.roles_rewards.some(obj => Object.keys(obj)[0] == `l${newLevel.toString()}`);

                    if(giveRole) {
                        const roleToGive = data.plugins.levels.roles_rewards.find(reward => Object.keys(reward)[0] == `l${newLevel.toString()}`);
                        await message.guild.roles.fetch(roleToGive[`l${newLevel.toString()}`]).then(role => {
                            message.guild.member(message.author).roles.add(role).catch(() => {});
                        }).catch(() => {});
                    }
                }
            }
        }
    }

    const prefixes = [`<@!${client.user.id}> `, `<@${client.user.id}> `, data.prefix]
    let prefix = null;
    prefixes.forEach(p => {
        if(message.content.startsWith(p)) {
            prefix = p;
        }
    });

    if(message.mentions.members.size > 0 && !message.content.startsWith(prefix) && !(message.mentions.members.first()?.id === message.author.id)) {
        message.mentions.members.forEach(async (member) => {
            const user = await client.findOrCreateUser(member.user);
            if(user?.afk?.is_afk) message.channel.send(`Hey ${message.author}, ${member.user.tag} est actuellement afk : **${Discord.Util.removeMentions(user.afk.reason)}**`);
        });
    }

    if(dbUser && dbUser?.afk?.is_afk && !message.content.startsWith(`${data.prefix}setafk`)) {
        dbUser.afk = {
            is_afk: false,
            reason: null
        }

        dbUser.markModified("afk");
        dbUser.save();

        message.channel.send(`${message.author} n'est désormais plus afk.`);
    }

    if(message.guild.me.permissionsIn(message.channel).has('SEND_MESSAGES')) {
        if(message.content.match(new RegExp(`^<@!?${client.user.id}>( |)$`))) {
            message.channel.send(`Hey ${message.author} ! Mon préfixe est \`${data.prefix}\` dans ce serveur, fais \`${data.prefix}help\` pour avoir de l'aide !`);
        }
    }

    if(data.plugins.protection.antilink) {
        if(!data.plugins.protection.ignored_channels?.includes(message.channel.id)) {
            if(!message.member.roles.cache.array().some((role, i) => role.id === (data.plugins.protection.ignored_roles ? data.plugins.protection.ignored_roles[i] : null))) {
                if(/discord(?:(?:app)?\.com\/invite|\.gg(?:\/invite)?)\/([\w-]{2,255})/i.test(message.content)) {
                    if(!message.guild.member(message.author).hasPermission("MANAGE_MESSAGES")) {
                        return message.delete().then(() => {
                            if(data.plugins.logs.enabled && data.plugins.logs.channel) {
                                const embed = {
                                    color: 'RED',
                                    author: {
                                        name: message.author.username,
                                        icon_url: message.author.displayAvatarURL({ dynamic: true })
                                    },
                                    description: `${message.author} a envoyé une pub dans ${message.channel}!`,
                                    fields: [
                                        {
                                            name: "Message d'origine",
                                            value: message.content
                                        }
                                    ],
                                    footer: {
                                        text: client.config.embed.footer,
                                        icon_url: client.user.displayAvatarURL()
                                    }
                                }

                                if(embed.fields[0].value.length > 1000) {
                                    embed.fields[0].value = message.content.slice(0, 1000) + "...";
                                }

                                message.guild.channels.cache.get(data.plugins.logs.channel).send({ embed });
                            }
                        });
                    }
                }
            }
        }
    }

    if(!message.content.startsWith(prefix) || message.webhookID || !prefix) return;

    const args = message.content.slice(prefix.length).split(/ +/);
    const commandName = args.shift().toLowerCase();
    const customCommand = (await require('../models/Command').find({ guildID: message.guild.id })).filter((cmd) => cmd.name.toLowerCase() === commandName)?.[0];
    const command = client.commands.get(commandName) || client.commands.find(cmd => cmd.help.aliases && cmd.help.aliases.includes(commandName));
    if(!command && !customCommand) return;

    if(!message.guild.me.permissionsIn(message.channel).has(['SEND_MESSAGES', 'READ_MESSAGE_HISTORY'])) return;

    if(customCommand) {
        const {
            enabled,
            content,
            embed,
            image,
            whitelisted_members,
            whitelisted_roles,
            whitelisted_channels
        } = customCommand;

        if(!enabled) return;
        if(whitelisted_members && !message.member.permissions.has(['ADMINISTRATOR', 'MANAGE_GUILD']) && !whitelisted_members.includes(message.author.id)) return message.channel.send('⚠️ Vous ne pouvez pas utiliser cette commande !');
        if(whitelisted_roles && !message.member.permissions.has(['ADMINISTRATOR', 'MANAGE_GUILD']) && !whitelisted_roles.some((r) => message.member.roles.cache.has(r))) return message.channel.send('⚠️ Vous ne pouvez pas utiliser cette commande !');
        if(whitelisted_channels && !whitelisted_channels.includes(message.channel.id)) return;

        if(embed) {
            embed.timestamp = new Date;
            embed.footer = { text: message.author.tag, icon_url: message.author.displayAvatarURL({ dynamic: true }) };

            if(image) {
                return message.channel.send(parseContent(), { embed, files: [{ attachment: image, name: 'image.png' }] });
            } else {
                return message.channel.send(parseContent(), { embed });
            }
        } else if(image) {
            return message.channel.send(parseContent(), { files: [{ attachment: image, name: 'image.png' }] });
        } else if(content) {
            return message.channel.send(parseContent());
        } else {
            return;
        }

        function parseContent() {
            return content
                ?.replace(/{author}/g, message.author)
                .replace(/{authorname}/g, message.author.username)
                .replace(/{authortag}/g, message.author.tag)
                .replace(/{channel}/g, message.channel);
        }
    }

    if(command.help.botPerms.length > 0) {
        if(!message.guild.me.permissionsIn(message.channel).has(command.help.botPerms)) {
            return message.channel.send(`⚠️ ${message.author}, je n\'ai pas les permissions nécessaires pour faire cette commande. \nJ\'ai besoin des permissions suivantes: ${client.formatPermissions(command.help.botPerms.map(perm => `\`${perm}\``).join(', '))}`)
        }
    }

    if(command.help.memberPerms.length > 0) {
        if(!message.member.permissionsIn(message.channel).has(command.help.memberPerms)) {
            return message.channel.send(`⚠️ ${message.author}, vous n\'avez pas les permissions nécessaires pour faire cette commande!`);
        }
    }

    if(command.help.args && !args.length) {
        return client.commands.get('help').run(client, message, [command.help.name], data);
    }

    if(!client.cooldowns.has(command.help.name)) {
        client.cooldowns.set(command.help.name, new Discord.Collection());
    }

    const tStamps = client.cooldowns.get(command.help.name);
    const cdAdmount = (command.help.cooldown || 0) * 1000;

    if(tStamps.has(message.author.id)) {
        const cdExpirationTime = tStamps.get(message.author.id) + cdAdmount;

        if(Date.now() < cdExpirationTime) {
            timeLeft = (cdExpirationTime - Date.now()) / 1000;
            return message.channel.send(`⚠️ Attendez encore **${timeLeft.toFixed(0)}s** avant de réutiliser cette commande!`)
            .then(async msg => {
                await msg.delete({ timeout: 5000 });
            }).catch(() => {});
        }
    }

    tStamps.set(message.author.id, Date.now());
    setTimeout(() => tStamps.delete(message.author.id), cdAdmount);

    try {
        command.run(client, message, args, data, userData);
    } catch (error) {
        console.log(error.message);
        message.channel.send(`Une erreur est survenue lors de l\'exécution de la commande. \n\`\`\`js\n${error.message}\n\`\`\``);
        client.channels.cache.get(client.config.support.logs).send(`Une erreur est survenue lors de la commande ${commandName}: \n\`\`\`js\n${error.message}\n\`\`\``);
    }
}
